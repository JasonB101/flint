function extractPhoneNumber(text) {
  if (!text) return ""

  // Try multiple phone number formats
  const phoneRegexes = [
    /(\d{1})-(\d{3})-(\d{3})-(\d{4})/, // 1-xxx-xxx-xxxx
    /(\d{3})-(\d{3})-(\d{4})/, // Standard xxx-xxx-xxxx
    /\((\d{3})\)\s*(\d{3})-(\d{4})/, // (xxx) xxx-xxxx
    /(\d{3})\.(\d{3})\.(\d{4})/, // xxx.xxx.xxxx
    /\b(\d{10})\b/, // 10 consecutive digits
  ]

  // Try each regex pattern
  for (const regex of phoneRegexes) {
    const match = text.match(regex)
    if (match) {
      // Format with country code: 1-xxx-xxx-xxxx
      if (regex.source.includes("\\d{1}")) {
        return `${match[2]}-${match[3]}-${match[4]}`
      }
      // Standard format: xxx-xxx-xxxx
      else if (regex.source.includes("\\d{3}\\)-\\d{3}")) {
        return match[0]
      }
      // Parentheses format: (xxx) xxx-xxxx
      else if (regex.source.includes("\\(")) {
        return `${match[1]}-${match[2]}-${match[3]}`
      }
      // Period format: xxx.xxx.xxxx
      else if (regex.source.includes("\\.")) {
        return match[0].replace(/\./g, "-")
      }
      // Raw 10 digits: xxxxxxxxxx
      else if (regex.source.includes("\\b\\(\\d{10}\\)")) {
        const digits = match[1]
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
      }
      // Standard xxx-xxx-xxxx
      else {
        return match[0]
      }
    }
  }

  return ""
}
module.exports = extractPhoneNumber
