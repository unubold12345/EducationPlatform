// Typography only. Stored prompts, snapshot versions and grading inputs stay untouched.
export function practiceDisplayText(text:string) {
  return text.replace(/([А-Яа-яӨөҮүЁё])(?=\d)/g,"$1 ")
    .replace(/(\d)(?=[А-Яа-яӨөҮүЁё])/g,"$1 ")
    .replace(/(\d)(?=°C)/g,"$1 ");
}
