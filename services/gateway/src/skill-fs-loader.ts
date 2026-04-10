/**
 * Skill File System Loader — Load skills from /skills/<persona>/<slug>/SKILL.md.
 *
 * Parses YAML frontmatter + markdown body into runtime skill definitions.
 * Falls back silently when the folder doesn't exist so existing TS skill
 * literals continue to work.
 *
 * Folder layout:
 *   skills/engineering/pr-review-assistant/SKILL.md
 *   skills/engineering/pr-review-assistant/examples/good-review.md (optional)
 *   skills/engineering/pr-review-assistant/prompt.txt               (optional)
 *
 * Frontmatter schema (YAML between `---` delimiters):
 *   id: eng-001
 *   slug: pr-review-assistant
 *   name: PR Review Assistant
 *   description: ...
 *   icon: 🔍
 *   cluster: Code Quality
 *   complexity: moderate
 *   estimatedTime: 45–90s
 *   requiredTools: [Claude]
 *   optionalTools: [GitHub]
 *   tags: [code-review, pr]
 *   inputs:
 *     - id: repo
 *       label: Repository
 *       type: text
 *       required: true
 *       section: basic
 *   steps:
 *     - id: s1
 *       order: 1
 *       name: Fetch PR
 *       agent: Code Reviewer
 *       outputKey: pr_metadata
 *   outputs: [pr_metadata, review_summary]
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface FSSkillDef {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon?: string;
    persona: string;
    cluster?: string;
    complexity?: 'simple' | 'moderate' | 'complex';
    estimatedTime?: string;
    inputs?: unknown[];
    steps?: unknown[];
    outputs?: string[];
    requiredTools?: string[];
    optionalTools?: string[];
    tags?: string[];
    systemPrompt?: string;     // from markdown body
    sourcePath?: string;       // absolute path to SKILL.md
    supportingFiles?: string[]; // relative paths
    extends?: string;          // parent skill id
}

export interface FSLoadResult {
    skills: FSSkillDef[];
    errors: Array<{ path: string; error: string }>;
}

// ═══════════════════════════════════════════════════════════════
// YAML Parser (minimal, sufficient for our frontmatter shape)
// ═══════════════════════════════════════════════════════════════

/**
 * Parse a small subset of YAML:
 *   - scalars (strings, numbers, booleans)
 *   - flow sequences: `[a, b, c]`
 *   - block sequences with dashes
 *   - nested maps via indentation
 *
 * Not a full YAML parser — suitable for SKILL.md frontmatter.
 */
function parseYaml(text: string): Record<string, unknown> {
    const lines = text.split('\n');
    const result: Record<string, unknown> = {};
    let i = 0;

    const parseScalar = (s: string): unknown => {
        const trimmed = s.trim();
        if (trimmed === '') return '';
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'null' || trimmed === '~') return null;
        if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
        if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
        // Flow sequence: [a, b, c]
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const inner = trimmed.slice(1, -1);
            if (!inner.trim()) return [];
            return inner.split(',').map(s => parseScalar(s.trim()));
        }
        // Strip surrounding quotes
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.slice(1, -1);
        }
        return trimmed;
    };

    const getIndent = (line: string): number => {
        let n = 0;
        while (n < line.length && line[n] === ' ') n++;
        return n;
    };

    const parseBlock = (baseIndent: number): unknown => {
        // Detect whether this block is a sequence or a map by peeking at the first non-empty line
        let firstContentLine = i;
        while (firstContentLine < lines.length && (lines[firstContentLine]!.trim() === '' || lines[firstContentLine]!.trim().startsWith('#'))) {
            firstContentLine++;
        }
        if (firstContentLine >= lines.length) return null;
        const firstLine = lines[firstContentLine]!;
        const indent = getIndent(firstLine);
        if (indent < baseIndent) return null;

        // Is it a sequence?
        if (firstLine.slice(indent).startsWith('- ')) {
            return parseSequence(indent);
        }
        return parseMap(indent);
    };

    const parseSequence = (indent: number): unknown[] => {
        const arr: unknown[] = [];
        while (i < lines.length) {
            const line = lines[i]!;
            if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
            const lineIndent = getIndent(line);
            if (lineIndent < indent) break;
            if (lineIndent > indent || !line.slice(lineIndent).startsWith('- ')) break;
            // `- key: value` inline or `- value`
            const after = line.slice(lineIndent + 2);
            if (after.includes(':')) {
                // Start a new map item — advance i, then parse map starting with this line's key
                // Rebuild a virtual line without the `- ` prefix
                lines[i] = ' '.repeat(lineIndent + 2) + after;
                const item = parseMap(lineIndent + 2);
                arr.push(item);
            } else {
                arr.push(parseScalar(after));
                i++;
            }
        }
        return arr;
    };

    const parseMap = (indent: number): Record<string, unknown> => {
        const obj: Record<string, unknown> = {};
        while (i < lines.length) {
            const line = lines[i]!;
            if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
            const lineIndent = getIndent(line);
            if (lineIndent < indent) break;
            if (lineIndent > indent) { i++; continue; } // Skip over-indented lines (handled by recursive calls)

            const content = line.slice(lineIndent);
            const colonIdx = content.indexOf(':');
            if (colonIdx === -1) { i++; continue; }

            const key = content.slice(0, colonIdx).trim();
            const rest = content.slice(colonIdx + 1).trim();
            i++;

            if (rest === '') {
                // Nested value on subsequent lines
                const nested = parseBlock(lineIndent + 2);
                obj[key] = nested;
            } else {
                obj[key] = parseScalar(rest);
            }
        }
        return obj;
    };

    // Top-level is a map
    i = 0;
    while (i < lines.length && (lines[i]!.trim() === '' || lines[i]!.trim().startsWith('#'))) i++;
    if (i >= lines.length) return result;

    return parseMap(0);
}

// ═══════════════════════════════════════════════════════════════
// Skill Loader
// ═══════════════════════════════════════════════════════════════

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseSkillMd(content: string, sourcePath: string): FSSkillDef | null {
    const match = FRONTMATTER_RE.exec(content);
    if (!match) return null;

    const yaml = match[1]!;
    const body = content.slice(match[0].length).trim();

    try {
        const frontmatter = parseYaml(yaml) as any;
        if (!frontmatter.id || !frontmatter.slug || !frontmatter.name) return null;

        const skill: FSSkillDef = {
            id: String(frontmatter.id),
            slug: String(frontmatter.slug),
            name: String(frontmatter.name),
            description: String(frontmatter.description ?? ''),
            icon: frontmatter.icon ? String(frontmatter.icon) : undefined,
            persona: String(frontmatter.persona ?? 'general'),
            cluster: frontmatter.cluster ? String(frontmatter.cluster) : undefined,
            complexity: frontmatter.complexity as any,
            estimatedTime: frontmatter.estimatedTime ? String(frontmatter.estimatedTime) : undefined,
            inputs: Array.isArray(frontmatter.inputs) ? frontmatter.inputs : [],
            steps: Array.isArray(frontmatter.steps) ? frontmatter.steps : [],
            outputs: Array.isArray(frontmatter.outputs) ? frontmatter.outputs : [],
            requiredTools: Array.isArray(frontmatter.requiredTools) ? frontmatter.requiredTools : [],
            optionalTools: Array.isArray(frontmatter.optionalTools) ? frontmatter.optionalTools : [],
            tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
            systemPrompt: body || undefined,
            sourcePath,
            extends: frontmatter.extends ? String(frontmatter.extends) : undefined,
        };
        return skill;
    } catch (err) {
        console.warn(`[skill-fs-loader] failed to parse ${sourcePath}:`, err);
        return null;
    }
}

/**
 * Load skills for a persona from /skills/<persona>/<slug>/SKILL.md.
 *
 * Returns null if the folder doesn't exist so callers can fall back to
 * the existing TS literal arrays.
 */
export function loadSkillsFromFs(persona: string, skillsRoot?: string): FSLoadResult | null {
    const root = skillsRoot ?? resolve(process.cwd(), 'skills', persona);

    if (!existsSync(root)) return null;

    let stat;
    try { stat = statSync(root); } catch { return null; }
    if (!stat.isDirectory()) return null;

    const result: FSLoadResult = { skills: [], errors: [] };

    let entries: string[];
    try { entries = readdirSync(root); } catch (err) {
        result.errors.push({ path: root, error: err instanceof Error ? err.message : String(err) });
        return result;
    }

    for (const entry of entries) {
        const skillDir = join(root, entry);
        let entryStat;
        try { entryStat = statSync(skillDir); } catch { continue; }
        if (!entryStat.isDirectory()) continue;

        const skillMdPath = join(skillDir, 'SKILL.md');
        if (!existsSync(skillMdPath)) continue;

        try {
            const content = readFileSync(skillMdPath, 'utf-8');
            const parsed = parseSkillMd(content, skillMdPath);
            if (parsed) {
                parsed.persona = persona;

                // Collect supporting files
                try {
                    const files = readdirSync(skillDir).filter(f => f !== 'SKILL.md');
                    if (files.length > 0) parsed.supportingFiles = files;
                } catch {}

                result.skills.push(parsed);
            } else {
                result.errors.push({ path: skillMdPath, error: 'Invalid or missing frontmatter' });
            }
        } catch (err) {
            result.errors.push({ path: skillMdPath, error: err instanceof Error ? err.message : String(err) });
        }
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════
// Hot reload (manual trigger via API)
// ═══════════════════════════════════════════════════════════════

let loadedCache: Map<string, FSLoadResult> = new Map();

export function getFsSkills(persona: string): FSLoadResult | null {
    if (loadedCache.has(persona)) return loadedCache.get(persona)!;
    const result = loadSkillsFromFs(persona);
    if (result) loadedCache.set(persona, result);
    return result;
}

export function reloadFsSkills(persona?: string): { reloaded: string[]; errors: Array<{ path: string; error: string }> } {
    const errors: Array<{ path: string; error: string }> = [];
    const reloaded: string[] = [];

    if (persona) {
        loadedCache.delete(persona);
        const result = loadSkillsFromFs(persona);
        if (result) {
            loadedCache.set(persona, result);
            reloaded.push(persona);
            errors.push(...result.errors);
        }
    } else {
        // Reload all cached personas
        const personas = Array.from(loadedCache.keys());
        loadedCache.clear();
        for (const p of personas) {
            const result = loadSkillsFromFs(p);
            if (result) {
                loadedCache.set(p, result);
                reloaded.push(p);
                errors.push(...result.errors);
            }
        }
    }

    return { reloaded, errors };
}

export function getAllFsSkills(): FSSkillDef[] {
    const all: FSSkillDef[] = [];
    for (const result of loadedCache.values()) {
        all.push(...result.skills);
    }
    return all;
}
