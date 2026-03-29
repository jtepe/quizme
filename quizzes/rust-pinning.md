# Rust Pinning

## Which statements about what `Pin<Ptr>` actually pins are correct?
### Choices
* > `Pin<Ptr>` pins the pointee that `Ptr` dereferences to, not the pointer wrapper itself.
* > Moving a `Pin<Box<T>>` value between variables is fine even when `T: !Unpin`, because the heap allocation containing `T` is what matters.
* > Whether `Pin<Box<T>>` has meaningful restrictions depends on whether `T: Unpin`, not on whether `Box<T>: Unpin`.
* `Pin<Box<T>>` itself becomes immovable as a value as soon as `T: !Unpin`.
* `Pin` works by switching the compiler into a special move-checking mode that ordinary library code cannot express.
### Answer
`Pin` is a library-level contract around a pointer type. The promise is about the pointee staying valid at the same address until `drop`, not about freezing the pointer wrapper in place.

That is why moving a `Pin<Box<T>>` is fine: the `Box` pointer value moves, but the allocation holding `T` does not. The relevant `Unpin` interaction is with `<Ptr as Deref>::Target`, so `T` is what matters for `Pin<Box<T>>`, not `Box<T>` itself.

## Why does a type that relies on pinning for soundness usually need to opt out of `Unpin`?
### Choices
* > `Unpin` is an auto trait, so a struct whose fields are all `Unpin` will usually become `Unpin` unless it opts out.
* > If the type stays `Unpin`, safe code can recover something equivalent to ordinary `&mut Self` access from `Pin<&mut Self>`, so pinning cannot be relied on for soundness.
* Implementing `Drop` automatically makes the type `!Unpin`.
* `PhantomPinned` means every field of the struct automatically becomes structurally pinned.
### Answer
If a type needs pinning guarantees to stay sound, it must not accidentally remain `Unpin`. Otherwise safe code can use APIs such as `Pin::get_mut` and treat the pinning wrapper as a facade, which defeats any invariant that depended on the value never moving once pinned.

`PhantomPinned` is the standard way to opt out of the auto-trait. It does not by itself decide which fields are structurally pinned; that is a separate API design question.

## Which statements about `pin!` are correct?
### Choices
* > `pin!` performs local pinning without creating a fresh heap allocation by itself.
* `pin!` always means the value is physically stored on the native call stack.
* > A `Pin<&mut T>` produced by `pin!` cannot escape the scope that owns the pinned local.
* > In an `async` context, a `pin!` local may live inside the future's state machine rather than on the native stack.
* > If `T: Unpin`, a `Pin<&mut T>` from `pin!` still allows ordinary move-enabling operations through safe APIs, because pinning restrictions collapse for `Unpin` pointees.
### Answer
`pin!` is local pinning, not heap pinning. Outside `async`, that usually corresponds to stack storage, but inside an `async` block or function the storage may instead live inside the future object.

The resulting `Pin<&mut T>` is tied to the lifetime of the local, so it cannot be returned from that scope. Also, `pin!` does not magically make an `Unpin` type immovable; for `Unpin` pointees, `Pin<&mut T>` behaves much like `&mut T`.

## Which statements about safe and unsafe `Pin` constructors and accessors are correct?
### Choices
* > `Pin::new(ptr)` is only safe when the pointee type is `Unpin`.
* > `Pin::into_inner(pin)` is only safe when the pointee type is `Unpin`.
* > `unsafe { Pin::into_inner_unchecked(pin) }` requires that the returned pointer continue to be treated as pinned until the pointee's `drop` completes.
* Dropping a `Pin<&mut T>` ends the pinning promise for `T`.
### Answer
The safe constructor and safe unwrapping APIs only exist when the pointee is `Unpin`, because in that case pinning guarantees can be ignored without breaking anything.

For `!Unpin` pointees, unsafe escape hatches are only sound if the caller continues upholding the full pinning contract afterward. Dropping a `Pin<&mut T>` does not end the promise, because that reference does not own the value.

## Which uses of `Pin::new_unchecked` are unsound or require the exact long-term promise the docs warn about?
### Choices
* > Creating `Pin<&mut T>` to a stack local with `Pin::new_unchecked`, then later moving that local after the `Pin<&mut T>` has been dropped.
* > Calling `Pin::new_unchecked` on an `Rc<T>` when another path could later regain unconstrained mutable access to the same allocation.
* > Inside a `move` closure, pinning a captured future with `Pin::new_unchecked(&mut captured)`, then moving the closure itself and calling it again.
* `Pin::new_unchecked` is fine whenever the `Pin` value itself is short-lived and never leaves the function.
### Answer
`Pin::new_unchecked` is dangerous because the obligation lasts until the pointee is dropped, not until that particular `Pin` wrapper goes away. Moving the original stack local later is still a contract violation.

The same issue makes `Rc<T>` and moved closure captures subtle: there can be other ways to move or access the underlying value that are not constrained by the pinned API, so the caller must prove those paths cannot violate the pinning promise.

## A self-referential type stores a raw pointer to one of its own fields. Which construction order upholds the pinning invariant?
```rust
struct Unmovable {
    data: [u8; 64],
    slice: std::ptr::NonNull<[u8]>,
    _pin: std::marker::PhantomPinned,
}
```
### Choices
* Build `Unmovable`, set `slice` to point into it, and only then move it into a `Box`.
* > Move the value into its final storage first, initialize the self-reference there, and only then expose pinning.
* > `Box::into_pin(boxed)` pins an already boxed value in place without reallocating it.
* Once you have a `Pin<&mut Self>`, you may use ordinary mutable access to rearrange fields as long as the addresses are restored before returning.
### Answer
For a self-referential type, the self-pointer must be created only after the value is already at the address where it will remain. Writing the pointer before the last move leaves it pointing to the old location.

This is why the standard pattern is: construct, move into a `Box`, initialize the self-reference while already in that allocation, then convert the box to `Pin<Box<Self>>` with `Box::into_pin`.

## A library wants to expose `fn project_inner(self: Pin<&mut Outer>) -> Pin<&mut Inner>`. What must be justified for this to be sound?
### Choices
* > The returned `Inner` must stay at a stable address whenever `Outer` stays pinned, and the projection must not move out of `Outer`.
* `Inner: Unpin` is enough by itself.
* > This is a structural pinning decision the type author must make consistently across the API.
* If one method exposes `&mut Inner` from `Pin<&mut Outer>`, another method may still independently expose `Pin<&mut Inner>` for the same field with no extra risk.
### Answer
Projecting a pin to a field is only sound when pinning the outer value also gives the right guarantee for that field. That is the heart of structural pinning.

`Inner: Unpin` does not automatically make a `Pin<&mut Inner>` projection sound. In fact, mixing plain mutable access and pinned access inconsistently for the same field is exactly the kind of API design mistake that can invalidate pinning assumptions.

## Which statements about `Pin::map_unchecked_mut` and unsafe pin projections are correct?
### Choices
* > The mapping closure must not move out of the value it receives.
* > The returned subreference must remain pinned whenever the original value remains pinned.
* `map_unchecked_mut` is safe because the closure only receives `&mut T`, not an owned `T`.
* > Using `map_unchecked_mut` to project through `ManuallyDrop<T>` to obtain `Pin<&mut T>` is unsound if `T`'s destructor can then be skipped.
### Answer
Unsafe projection APIs are only sound if the projected reference truly inherits the parent's pinning guarantee and if the projection code never moves out of the parent while creating the subreference.

Projecting through `ManuallyDrop<T>` is the classic trap. If the inner `T` can later avoid running its destructor, then the projected `Pin<&mut T>` has violated pinning's drop guarantee.

## Why is `Pin::set` sound even when the pointee type is `!Unpin`?
### Choices
* > Because the old value is dropped before the memory slot is overwritten.
* > Because the replacement is another valid value of the same type in the same location.
* Because `set` secretly moves the old value into hidden backup storage first.
* Because `set` only exists for `T: Unpin`.
### Answer
`Pin::set` does not create a way to move a pinned `!Unpin` value out. Instead, it destroys the old occupant in place and then writes a fresh value of the same type into the same slot.

That preserves the key invariant: the original pinned value remains valid at that address until its destructor runs.

## Which statements about `Future::poll(self: Pin<&mut Self>, ...)` are correct?
### Choices
* > The signature exists so futures that become self-referential can still be implemented soundly.
* `poll` uses `Pin` because every future is `!Unpin`.
* > Futures that are `Unpin` can still use the same API ergonomically because `Pin` restrictions collapse for `Unpin` pointees.
* > Manually polling a future usually means pinning it first with something like `pin!` or `Box::pin`.
### Answer
The `Future` trait uses `Pin<&mut Self>` because some futures, especially compiler-generated `async fn` futures, can contain self-referential state that must not move between polls.

Not every future is `!Unpin`, though. The shared API works because `Pin` becomes mostly a facade for `Unpin` futures while remaining meaningful for address-sensitive ones.

## Which scenarios violate the drop guarantee for pinned data?
### Choices
* > Reusing or deallocating custom storage that held pinned data without first calling `ptr::drop_in_place`.
* > Manually invalidating a pinned `Some(v)` by turning it into `None` without first running `v`'s destructor.
* > Shrinking a buffer of pinned elements with something like `set_len` so elements are invalidated without being dropped.
* `mem::forget(Box<T>)` for a pinned `T`, where the allocation is leaked forever, necessarily violates pinning.
### Answer
Pinning requires more than "do not move this value." The value must remain valid at the same address until its destructor has had a chance to run. Invalidating or reusing the storage first breaks that rule.

Leaking the storage entirely is different. If the allocation is never reused, the address remains valid forever, so the drop guarantee is not violated.

## Which statements about implementing `Drop` for an address-sensitive `!Unpin` type are correct?
### Choices
* > You should reason as if `drop` had signature `fn drop(self: Pin<&mut Self>)`, even though the trait actually gives `&mut self`.
* > `#[repr(packed)]` types are incompatible with pinning because drop may move fields during destruction.
* You may freely move structurally pinned fields inside `drop` because the value is being destroyed anyway.
* The right pattern is to call `Pin::into_inner` in `drop` and then destructure normally.
### Answer
If your type may ever be pinned, its destructor has to preserve the same invariants as every other method. Destruction is not a free pass to move pinned fields before `drop` has actually finished.

That is also why `#[repr(packed)]` is incompatible with pinning: the compiler may move fields to access them safely during destruction.

## A container type wants to expose `fn get_pin_mut(self: Pin<&mut Self>, i: usize) -> Pin<&mut T>`. Which consequences follow if that pinning is structural for its elements?
### Choices
* > Operations like `push` become problematic because they may reallocate and move elements.
* > Operations like `pop` become problematic because they move an element out of the container.
* > The destructor may need stronger behavior, such as ensuring all structurally pinned elements are dropped even if one destructor panics.
* The container can still safely implement `Unpin` unconditionally because only the elements, not the container, are pinned.
### Answer
Once a pinned borrow can be projected to elements, the container has promised that those element addresses stay stable while the container stays pinned. That blocks ordinary operations that can move elements around.

It also strengthens destruction requirements. If deallocation could happen after some pinned elements fail to get dropped, the drop guarantee for those elements would be broken.

## Which statements about `Pin<&T>`, shared references, and interior mutability are correct?
### Choices
* > `Pin<&T>::get_ref` is safe because you cannot move a `T` out of a shared reference.
* > Interior mutability types are not automatically incompatible with pinning; the trouble comes from APIs that can still move a supposedly pinned interior through some other path.
* `Pin<&T>` guarantees that every value reachable from `T` is also pinned.
* If `T` contains a `RefCell<U>`, then `Pin<&T>` alone already makes projecting a `Pin<&U>` from it safe.
### Answer
`Pin<&T>` only says that the specific pointee behind that shared reference is pinned. It does not recursively pin everything reachable through it.

Interior mutability is only a problem when the API surface lets you create a pinned view of some interior value while another safe path could still move that same interior value.

## Suppose `Outer` contains a field `field: Field`, and the API explicitly decides that pinning is not structural for `field`. Which statements are correct?
### Choices
* > A method from `Pin<&mut Outer>` to `&mut Field` can be sound, as long as the implementation never relies on `field` being pinned.
* > In that design, `Outer` may even implement `Unpin` regardless of whether `Field: Unpin`, provided no unsafe code assumes pinning propagates to `field`.
* A `!Unpin` field forces `Outer` to be `!Unpin` in every sound design.
* Once `Outer` is pinned, all of its fields are automatically pinned whether or not the API exposes that fact.
### Answer
Structural pinning is a design choice, not an automatic property of every field. If the type author chooses that pinning does not propagate to `field`, then exposing `&mut Field` from `Pin<&mut Outer>` can be fine.

In that case, the outer type can also be `Unpin` even if `Field` is not. The obligation is simply that no unsafe code may later pretend that `field` was pinned through `Outer` after all.
