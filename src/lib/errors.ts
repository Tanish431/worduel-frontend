export function formatErrorMessage(
    message: string | null | undefined,
    fallback = "Something went wrong",
): string {
    const normalized = message?.trim() || fallback;
    return normalized.replace(/^[a-z]/, (letter) => letter.toUpperCase());
}
