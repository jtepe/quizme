# Rust Pinning

## Which statements about what `Pin<Ptr>` actually pins are correct?
### Choices
* > `Pin<Ptr>` pins the pointee that `Ptr` dereferences to, not the pointer wrapper itself.
* `Pin` works by changing the compiler's move semantics with special language magic.
* > Moving a `Pin<Box<T>>` value is fine; the important promise is that the `T` inside the box is not moved or invalidated.
* `Pin<Box<T>>` becomes immovable as a value as soon as `T: !Unpin`.
### Answer
`Pin` is a library-level contract around a pointer type, not a special compiler mode. The pointer object can still move around like any other value; what is constrained is the pointee at the address behind that pointer.

This is why returning or reassigning a `Pin<Box<T>>` is fine even when `T: !Unpin`: the box pointer value moves, but the allocation containing `T` stays put. The standard docs are explicit that `Pin<Ptr>` pins the pointee, not `Ptr` itself.

## Why does a type that relies on pinning usually need a `PhantomPinned` field?
### Choices
* > Because otherwise the type may auto-implement `Unpin` if all of its fields are `Unpin`.
* > If the type stays `Unpin`, safe code may treat a `Pin<&mut Self>` largely like `&mut Self`, which defeats relying on pinning for soundness.
* Adding `Pin<&mut Self>` methods automatically makes the type `!Unpin`.
* `PhantomPinned` is only needed to make heap allocation possible.
### Answer
`Unpin` is an auto trait, so a struct whose fields are all `Unpin` will usually also be `Unpin`. If your implementation depends on the value never moving once pinned, that auto-derived behavior is wrong for your type.

Adding a `PhantomPinned` field opts the type out of `Unpin`, which is what lets pinning guarantees become meaningful for soundness. A method signature alone does not change the auto-trait result.

## Which statements about `pin!` are correct?
### Choices
* > `pin!` performs local pinning without creating a fresh heap allocation by itself.
* `pin!` always means the value is physically stored on the stack.
* > A `Pin<&mut T>` produced by `pin!` cannot escape the scope that owns the pinned local.
* > In an `async` context, a `pin!` local may live inside the future's state machine rather than on the native call stack.
### Answer
`pin!` creates a locally pinned `Pin<&mut T>`. Outside `async`, that often corresponds to stack storage, but the docs call it local pinning because in `async` code the storage may instead be inside the future object.

The resulting pinned reference is tied to the lifetime of that local, so it cannot be returned from the block that owns it. If you need to return a pinned owner, `Box::pin` is the usual answer.

## A self-referential type stores a raw pointer to one of its own fields. Which construction order upholds the pinning invariant?
```rust
struct Unmovable {
    data: [u8; 64],
    slice: std::ptr::NonNull<[u8]>,
    _pin: std::marker::PhantomPinned,
}
```
### Choices
* Build `Unmovable`, set `slice` to point into it, then move it into a `Box`.
* > Place the value into its final storage first, initialize the self-reference there, then pin that storage in place.
* Pin first, then use ordinary mutable access to freely rearrange fields.
* Write the raw self-pointer before the final move because raw pointers are unaffected by moves.
### Answer
For a self-referential type, the pointer must only be created once the value is already at the address where it will remain. Creating the self-reference before the last move leaves the raw pointer pointing at the old location.

The standard library's `Unmovable` example does exactly this: construct the value, move it into a `Box`, initialize the self-reference while it is already in that allocation, and only then convert the box into `Pin<Box<Self>>` with `Box::into_pin`.

## Which statements about `Pin::new`, `Pin::new_unchecked`, and `Pin::into_inner` are correct?
### Choices
* > `Pin::new(&mut t)` is only safe when the pointee type is `Unpin`.
* > `Pin::new_unchecked(&mut t)` is unsafe because pinning must remain valid until the value is dropped, not merely while that particular `Pin<&mut T>` exists.
* `Pin::into_inner` is always safe because it only unwraps the pointer wrapper.
* > `Pin::new_unchecked` on `Rc<T>` is unsafe because aliases can exist that are not constrained by the pinning contract.
### Answer
Safe constructors like `Pin::new` only exist when `T: Unpin`, because in that case pinning guarantees can be ignored. For `T: !Unpin`, constructing a pin is only sound if you can uphold the stronger promise that the pointee will stay pinned until drop.

That is why `Pin::new_unchecked(&mut t)` is subtle: dropping the `Pin<&mut T>` does not end the promise. It is also why shared owners like `Rc<T>` are dangerous here, since other aliases can interact with the same allocation outside the pinned API.

## Why is `Pin::set` sound even when the pointee type is `!Unpin`?
### Choices
* > Because the old value is dropped before the memory slot is overwritten.
* > Because the replacement is another valid value of the same type in the same location.
* Because `set` secretly moves the old value into hidden backup storage.
* Because `set` only exists for `T: Unpin`.
### Answer
`Pin::set` is allowed because pinning is about keeping a value valid at a stable location until its destructor runs. Replacing the value is sound if the old value is properly dropped first and the location continues to hold a valid value of the same type afterward.

So `set` does not create an escape hatch that "moves out" a pinned `!Unpin` value. It destroys the old occupant in place, then writes the replacement into the same memory slot.

## A library wants to expose `fn project_inner(self: Pin<&mut Outer>) -> Pin<&mut Inner>`. What must be justified for this to be sound?
### Choices
* `Outer` must implement `Clone`.
* > The returned `Inner` must stay at a stable address whenever `Outer` stays pinned, and the projection must not move out of `Outer`.
* > This is a structural pinning question, not just a visibility question.
* `Inner: Unpin` is enough by itself.
### Answer
Projecting a pin to a field is only sound when pinning the outer value also implies the right guarantee for that field. That is the core of structural pinning: deciding which fields are themselves pinned by the outer pin and which are not.

`Inner: Unpin` does not solve this by itself. In fact, blindly exposing `Pin<&mut Inner>` for an `Unpin` field can be a mistake, because safe code could then move that `Inner` out through APIs that are allowed for `Unpin`.

## Which statements about `Future::poll(self: Pin<&mut Self>, ...)` are correct?
### Choices
* > The signature exists so futures that become self-referential can still be implemented soundly.
* `poll` uses `Pin` because every future is `!Unpin`.
* > Futures that are `Unpin` can still use the same API ergonomically because `Pin` restrictions collapse for `Unpin` pointees.
* > Manually polling a future usually means pinning it first with something like `pin!` or `Box::pin`.
### Answer
The `Future` trait uses `Pin<&mut Self>` because some futures, especially compiler-generated `async fn` futures, may contain self-referential state. Those futures need pinning for soundness.

Not every future is `!Unpin`, though. The `Unpin` auto trait exists largely to make APIs like `poll` work for both kinds of futures without splitting the trait in two.

## Which scenarios violate the drop guarantee for pinned data?
### Choices
* > Projecting through `ManuallyDrop<T>` to get a `Pin<&mut T>`, then relying on `ManuallyDrop` to suppress `T`'s destructor.
* > Manually invalidating storage that held a pinned `Some(v)` without first running `v`'s destructor.
* `mem::forget(Box<T>)` for a pinned `T`, where the allocation is leaked forever.
* > Reusing or deallocating custom storage that held pinned data without first calling `ptr::drop_in_place`.
### Answer
Pinning requires more than "do not move this value." The value must remain valid at the same address until its `drop` runs. If storage is invalidated or reused first, code that relied on the value staying there becomes unsound.

That is why pin-projecting through `ManuallyDrop<T>` is a classic trap and why custom allocation code must run the destructor before reusing storage. Leaking storage entirely is different: if the memory is never reused, the address remains valid forever, so the drop guarantee is not violated.

## Which statements about implementing `Drop` for an address-sensitive `!Unpin` type are correct?
### Choices
* > You should reason as if `drop` had signature `fn drop(self: Pin<&mut Self>)`, even though the trait actually gives `&mut self`.
* > `#[repr(packed)]` types are incompatible with pinning because drop may move fields during destruction.
* You may freely move pinned fields inside `drop` because the value is being destroyed anyway.
* The right pattern is to call `Pin::into_inner` in `drop` and then destructure normally.
### Answer
If your type may ever be pinned, `Drop` has to preserve the same invariants. The standard library docs recommend structuring your destructor as a thin `Drop::drop(&mut self)` wrapper that immediately hands off to an inner helper taking `Pin<&mut Self>`.

`#[repr(packed)]` is incompatible with pinning for the same reason: the compiler may move fields during drop to access them safely. Destruction is not a free pass to violate pinning guarantees before the destructor has actually finished.
