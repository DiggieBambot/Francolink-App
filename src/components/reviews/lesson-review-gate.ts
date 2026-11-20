// The lesson-review prompt and the Trustpilot prompt share one corner of the
// screen. This lets the second wait for the first's answer and stand down if
// a lesson is waiting to be rated; rating the lesson is the ask that matters.

let settle: (showing: boolean) => void = () => {};
const decided = new Promise<boolean>((resolve) => {
  settle = resolve;
});

/** Called once by LessonReviewPrompt when it knows whether it is showing. */
export function settleLessonReview(showing: boolean) {
  settle(showing);
}

/** True if the lesson prompt is showing. Gives up after `ms` and says no. */
export function lessonReviewShowing(ms = 6000): Promise<boolean> {
  return Promise.race([decided, new Promise<boolean>((r) => setTimeout(() => r(false), ms))]);
}
