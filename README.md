# quizme

Simple quiz generator that converts markdown files into self-contained, interactive HTML pages.

## Creating a quiz

Create a markdown file following this format:

```markdown
# Quiz title

## Question title
### Choices
* Wrong answer
* > Correct answer
* Another wrong answer
### Answer
Explanation text that is shown after the user answers.
Can span multiple lines.

## Another question
### Choices
* > Correct choice one
* > Correct choice two
* Wrong choice
### Answer
Questions can have multiple correct answers.
Prefix each correct choice with `>`.
```

- The quiz title goes under a `#` heading
- Each question is a `##` heading
- Choices go under `### Choices` as bullet points
- Correct choices start with `>`
- A question can have one or more correct choices
- The explanation goes under `### Answer` (shown after the user checks their answer)
- A quiz can have 1 to 20 questions, each with 2 to 6 choices

## Generating a quiz

```sh
bun run index.ts quizzes/example.md
```

This creates `quizzes/example.html` in the same directory as the input. You can also specify an output path:

```sh
bun run index.ts quizzes/example.md output.html
```

Open the generated HTML file in any browser — no server needed.
