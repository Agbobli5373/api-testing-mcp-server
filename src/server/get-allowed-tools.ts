/**
 * Read MCP_TOOLS env var and return an array of allowed tool names, or null to indicate "all tools".
 * Mirrors the helper used in the main project.
 */
export function getAllowedTools(): string[] | null {
    const allowed = process.env.MCP_TOOLS;
    if (!allowed) return null; // No filtering - use all tools
    try {
        const parsed = JSON.parse(allowed);
        // If it's an array, use it for filtering
        if (Array.isArray(parsed)) {
            return parsed as string[];
        }
        // If it's "*", return null to indicate all tools
        if (parsed === "*") {
            return null;
        }
        return null; // Default to all tools for any other JSON value
    } catch {
        // Try to parse as comma-separated string
        const split = allowed.split(',').map(t => t.trim()).filter(t => t.length > 0);
        return split.length > 0 ? split : null;
    }
}
