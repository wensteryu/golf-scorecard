import { describe, expect, it } from 'vitest';
import { activeTab, shouldShowTopNav } from './nav';

describe('shouldShowTopNav', () => {
  it('hides the bar during hole entry, review and reflect', () => {
    expect(shouldShowTopNav('/student/round/abc')).toBe(false);
    expect(shouldShowTopNav('/student/round/abc/review')).toBe(false);
    expect(shouldShowTopNav('/student/round/abc/reflect')).toBe(false);
  });

  it('shows the bar everywhere else, including the round summary', () => {
    for (const p of ['/student', '/student/round/abc/summary', '/student/stats', '/student/new', '/coach', '/coach/review/x']) {
      expect(shouldShowTopNav(p)).toBe(true);
    }
  });
});

describe('activeTab', () => {
  it('matches section prefixes and falls back to the home tab', () => {
    expect(activeTab('student', '/student/history/abc').label).toBe('History');
    expect(activeTab('student', '/student/stats').label).toBe('Stats');
    expect(activeTab('student', '/student/new').label).toBe('Rounds');
    expect(activeTab('coach', '/coach/courses/x').label).toBe('Courses');
    expect(activeTab('coach', '/coach/student/x').label).toBe('Students');
  });
});
