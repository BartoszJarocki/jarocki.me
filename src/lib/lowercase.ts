import { Name } from '../data/bio';
import { GitHubUser, XUser } from '../data/links';

const keepCase = [Name, GitHubUser, XUser]
  .filter(Boolean)
  .sort((a, b) => b.length - a.length)
  .map((entry) => entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const kept = new RegExp(`(${keepCase.join('|') || '(?!)'})`);

export function caseRuns(text: string) {
  return text.split(kept).map((run, i) => ({ text: run, keep: i % 2 === 1 }));
}

export function lowercase(text: string) {
  return caseRuns(text)
    .map((run) => (run.keep ? run.text : run.text.toLowerCase()))
    .join('');
}
