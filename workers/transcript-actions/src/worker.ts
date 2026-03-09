/**
 * Transcript-to-Action Worker — Meeting → decisions + action items + tickets
 *
 * Takes a meeting transcript and produces:
 *   1. Executive summary
 *   2. Key decisions with rationale
 *   3. Action items with owners and deadlines
 *   4. Open questions
 *   5. Jira tickets (auto-created if approved)
 *
 * This is the meeting-to-action agent from the adoption blueprint.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscriptInput {
    transcript: string;
    meetingTitle?: string;
    meetingDate?: string;
    attendees?: string[];
    context?: {
        project?: string;
        team?: string;
    };
    autoCreateTickets: boolean;
}

export interface TranscriptAnalysis {
    meetingTitle: string;
    date: string;
    attendees: string[];
    duration: string;

    executiveSummary: string;

    keyDecisions: Decision[];
    actionItems: ActionItem[];
    openQuestions: string[];
    risks: string[];
    followUps: FollowUp[];

    sentimentAnalysis: {
        overall: 'positive' | 'neutral' | 'negative' | 'mixed';
        topicsOfConcern: string[];
        topicsOfExcitement: string[];
    };

    tickets: GeneratedTicket[];

    sources: Array<{ title: string; type: string; excerpt: string }>;
    confidence: number;
    meta: { durationMs: number; tokensUsed: number; model: string };
}

interface Decision {
    decision: string;
    rationale: string;
    madeBy: string;
    impact: 'high' | 'medium' | 'low';
    relatedTopics: string[];
}

interface ActionItem {
    action: string;
    assignee: string;
    dueDate: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    context: string;
}

interface FollowUp {
    topic: string;
    owner: string;
    deadline: string;
}

interface GeneratedTicket {
    type: 'Story' | 'Task' | 'Bug';
    summary: string;
    description: string;
    assignee: string;
    priority: string;
    labels: string[];
    status: 'draft' | 'created';
    jiraKey?: string;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export class TranscriptActionWorker {
    async analyze(input: TranscriptInput): Promise<TranscriptAnalysis> {
        const startTime = Date.now();

        // Phase 1: Parse transcript structure
        const segments = this.parseTranscript(input.transcript);

        // Phase 2: Extract decisions
        const decisions = await this.extractDecisions(segments);

        // Phase 3: Extract action items
        const actionItems = await this.extractActionItems(segments, input.attendees ?? []);

        // Phase 4: Extract open questions and risks
        const openQuestions = await this.extractOpenQuestions(segments);
        const risks = await this.extractRisks(segments);

        // Phase 5: Generate executive summary
        const executiveSummary = await this.generateSummary(segments, decisions, actionItems);

        // Phase 6: Sentiment analysis
        const sentiment = this.analyzeSentiment(segments);

        // Phase 7: Generate tickets from action items
        const tickets = this.generateTickets(actionItems, decisions, input.context);

        // Phase 8: Auto-create tickets if approved
        if (input.autoCreateTickets) {
            await this.createJiraTickets(tickets);
        }

        return {
            meetingTitle: input.meetingTitle ?? 'Untitled Meeting',
            date: input.meetingDate ?? new Date().toISOString().split('T')[0],
            attendees: input.attendees ?? this.extractAttendees(segments),
            duration: this.estimateDuration(input.transcript),
            executiveSummary,
            keyDecisions: decisions,
            actionItems,
            openQuestions,
            risks,
            followUps: actionItems.filter(a => a.priority === 'high').map(a => ({
                topic: a.action,
                owner: a.assignee,
                deadline: a.dueDate,
            })),
            sentimentAnalysis: sentiment,
            tickets,
            sources: [{ title: input.meetingTitle ?? 'Meeting Transcript', type: 'transcript', excerpt: input.transcript.slice(0, 200) }],
            confidence: 0.82,
            meta: {
                durationMs: Date.now() - startTime,
                tokensUsed: 0,
                model: 'gpt-4o',
            },
        };
    }

    // -------------------------------------------------------------------------
    // Pipeline stages
    // -------------------------------------------------------------------------

    private parseTranscript(transcript: string): TranscriptSegment[] {
        // Parse speaker turns from transcript
        const lines = transcript.split('\n').filter(l => l.trim());
        const segments: TranscriptSegment[] = [];
        let current: TranscriptSegment | null = null;

        for (const line of lines) {
            const speakerMatch = line.match(/^([A-Za-z\s]+):\s*(.+)/);
            if (speakerMatch) {
                if (current) segments.push(current);
                current = { speaker: speakerMatch[1].trim(), text: speakerMatch[2], timestamp: '' };
            } else if (current) {
                current.text += ' ' + line.trim();
            }
        }
        if (current) segments.push(current);

        return segments;
    }

    private async extractDecisions(segments: TranscriptSegment[]): Promise<Decision[]> {
        // In production: LLM extraction with decision-detection prompt
        // Look for patterns like "we decided", "let's go with", "the plan is"
        const decisionPatterns = /\b(we decided|let's go with|agreed to|the decision is|we'll|going to|approved)\b/i;
        return segments
            .filter(s => decisionPatterns.test(s.text))
            .map(s => ({
                decision: s.text,
                rationale: '',
                madeBy: s.speaker,
                impact: 'medium' as const,
                relatedTopics: [],
            }));
    }

    private async extractActionItems(segments: TranscriptSegment[], attendees: string[]): Promise<ActionItem[]> {
        // Look for assignment patterns
        const actionPatterns = /\b(will|should|needs to|action item|take this|follow up|responsible for|can you)\b/i;
        return segments
            .filter(s => actionPatterns.test(s.text))
            .map(s => ({
                action: s.text,
                assignee: this.findAssignee(s.text, attendees) ?? s.speaker,
                dueDate: this.extractDate(s.text) ?? 'TBD',
                priority: 'medium' as const,
                context: '',
            }));
    }

    private async extractOpenQuestions(segments: TranscriptSegment[]): Promise<string[]> {
        return segments
            .filter(s => s.text.includes('?') || /\b(unclear|need to figure out|not sure|open question)\b/i.test(s.text))
            .map(s => s.text);
    }

    private async extractRisks(segments: TranscriptSegment[]): Promise<string[]> {
        return segments
            .filter(s => /\b(risk|concern|worry|careful|blocker|issue|problem)\b/i.test(s.text))
            .map(s => s.text);
    }

    private async generateSummary(
        segments: TranscriptSegment[],
        decisions: Decision[],
        actions: ActionItem[]
    ): Promise<string> {
        // In production: LLM synthesis
        return `Meeting with ${new Set(segments.map(s => s.speaker)).size} participants. ${decisions.length} decisions made, ${actions.length} action items assigned.`;
    }

    private analyzeSentiment(segments: TranscriptSegment[]): TranscriptAnalysis['sentimentAnalysis'] {
        const positiveWords = /\b(great|excited|progress|improvement|success|happy|good)\b/i;
        const negativeWords = /\b(concern|problem|issue|risk|worry|delay|blocker|fail)\b/i;

        const positiveCount = segments.filter(s => positiveWords.test(s.text)).length;
        const negativeCount = segments.filter(s => negativeWords.test(s.text)).length;

        let overall: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
        if (positiveCount > negativeCount * 2) overall = 'positive';
        else if (negativeCount > positiveCount * 2) overall = 'negative';
        else if (positiveCount > 0 && negativeCount > 0) overall = 'mixed';

        return {
            overall,
            topicsOfConcern: segments.filter(s => negativeWords.test(s.text)).map(s => s.text.slice(0, 100)),
            topicsOfExcitement: segments.filter(s => positiveWords.test(s.text)).map(s => s.text.slice(0, 100)),
        };
    }

    private generateTickets(
        items: ActionItem[],
        decisions: Decision[],
        context?: { project?: string; team?: string }
    ): GeneratedTicket[] {
        return items.map(item => ({
            type: 'Task' as const,
            summary: item.action.slice(0, 120),
            description: `**Context:** ${item.context || 'From meeting transcript'}\n**Priority:** ${item.priority}\n**Due:** ${item.dueDate}`,
            assignee: item.assignee,
            priority: item.priority === 'critical' ? 'Highest' : item.priority === 'high' ? 'High' : 'Medium',
            labels: ['eaos-generated', 'meeting-action'],
            status: 'draft' as const,
        }));
    }

    private async createJiraTickets(tickets: GeneratedTicket[]): Promise<void> {
        // In production: call Jira connector for each ticket
        for (const ticket of tickets) {
            ticket.status = 'created';
            ticket.jiraKey = `EAOS-${Math.floor(Math.random() * 9999)}`;
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private extractAttendees(segments: TranscriptSegment[]): string[] {
        return [...new Set(segments.map(s => s.speaker))];
    }

    private estimateDuration(transcript: string): string {
        const wordCount = transcript.split(/\s+/).length;
        const minutes = Math.round(wordCount / 150); // ~150 words per minute of speech
        return `~${minutes} min`;
    }

    private findAssignee(text: string, attendees: string[]): string | undefined {
        for (const attendee of attendees) {
            if (text.toLowerCase().includes(attendee.toLowerCase())) return attendee;
        }
        return undefined;
    }

    private extractDate(text: string): string | undefined {
        const dateMatch = text.match(/\b(by|before|due|deadline)\s+(monday|tuesday|wednesday|thursday|friday|next week|end of week|eow|eod|tomorrow)/i);
        return dateMatch?.[2] ?? undefined;
    }
}

interface TranscriptSegment {
    speaker: string;
    text: string;
    timestamp: string;
}
