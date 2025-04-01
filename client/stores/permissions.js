const permittedCodes = [
  "FAST_ANSWER_GROUP_ALREADY_EXISTS",
  "EMPTY_FIELD",
  "NO_EXECUTOR",
  "NON_UNIQUE_LOGIN",
  "EMPTY_REQUIRED_FIELD",
]

function isPermitted(code) {
  return permittedCodes.includes(code);
}

export {isPermitted}