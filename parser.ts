export interface Choice {
  text: string;
  correct: boolean;
}

export interface Question {
  title: string;
  choices: Choice[];
  answer: string;
}

export interface Quiz {
  title: string;
  questions: Question[];
}

export function parseQuiz(markdown: string): Quiz {
  const lines = markdown.split("\n");

  let title = "";
  const questions: Question[] = [];

  let currentQuestion: { title: string; choices: Choice[]; answer: string } | null = null;
  let section: "none" | "choices" | "answer" = "none";
  let answerLines: string[] = [];

  for (const line of lines) {
    // Quiz title
    if (line.startsWith("# ") && !line.startsWith("## ") && !line.startsWith("### ")) {
      title = line.slice(2).trim();
      continue;
    }

    // New question
    if (line.startsWith("## ") && !line.startsWith("### ")) {
      // Save previous question
      if (currentQuestion) {
        currentQuestion.answer = answerLines.join("\n").trim();
        questions.push(currentQuestion);
      }
      currentQuestion = { title: line.slice(3).trim(), choices: [], answer: "" };
      section = "none";
      answerLines = [];
      continue;
    }

    // Section headers
    if (line.startsWith("### Choices")) {
      section = "choices";
      continue;
    }
    if (line.startsWith("### Answer")) {
      section = "answer";
      continue;
    }

    if (!currentQuestion) continue;

    if (section === "choices") {
      const choiceMatch = line.match(/^\*\s+>(.*)/);
      if (choiceMatch) {
        currentQuestion.choices.push({ text: choiceMatch[1]!.trim(), correct: true });
      } else {
        const normalMatch = line.match(/^\*\s+(.*)/);
        if (normalMatch) {
          currentQuestion.choices.push({ text: normalMatch[1]!.trim(), correct: false });
        }
      }
    }

    if (section === "answer") {
      answerLines.push(line);
    }
  }

  // Save last question
  if (currentQuestion) {
    currentQuestion.answer = answerLines.join("\n").trim();
    questions.push(currentQuestion);
  }

  if (!title) throw new Error("Quiz title not found (expected # Title)");
  if (questions.length === 0) throw new Error("No questions found (expected ## Question)");

  return { title, questions };
}
