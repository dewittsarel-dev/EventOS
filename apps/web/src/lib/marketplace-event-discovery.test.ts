import { describe, expect, it } from 'vitest';
import { eventCategories, guidedEventSearchTerms, interpretEventRequest } from './marketplace-event-discovery';

describe('marketplace event discovery', () => {
  it('interprets a natural-language wedding brief', () => {
    const brief = interpretEventRequest('Elegant outdoor wedding for 120 guests in Pretoria with neutral colours and a budget of R180,000');
    expect(brief.eventType).toBe('wedding');
    expect(brief.guests).toBe(120);
    expect(brief.city).toBe('Pretoria');
    expect(brief.budget).toBe(180000);
    expect(brief.categories).toContain('Floral and decor');
    expect(brief.followUpQuestions).toEqual([]);
  });

  it('asks only for essential missing details', () => {
    const brief = interpretEventRequest('I want an old fashioned function');
    expect(brief.searchTerms).toContain('vintage');
    expect(brief.followUpQuestions).toHaveLength(4);
  });

  it('builds guided style terms and category recommendations', () => {
    expect(guidedEventSearchTerms('wedding', 'Rustic', ['Green'])).toEqual(['wood', 'linen', 'neutral', 'green']);
    expect(eventCategories('corporate')).toContain('Technical production');
  });
});
