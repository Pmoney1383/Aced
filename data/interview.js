/* One-way (recorded) video interview bank. 30 questions across the areas such screens usually cover.
   Each has a coaching tip. Add your own by appending to the array. */
(function (root) {
  const Q = (cat, text, tip) => ({ cat, text, tip });
  const STAR = 'Use STAR: Situation, Task, Action, Result. Spend most of your time on what YOU did and finish with a measurable result.';
  const list = [
    Q('Introduction', 'Tell us about yourself and why you are interested in this role.', 'Aim for 90 seconds: present, past, future. Link your background to the role in your last sentence.'),
    Q('Introduction', 'What do you know about GeoComply and what the company does?', 'Mention geolocation compliance and fraud prevention for regulated industries such as online gaming and betting, and why accurate location verification matters. Check their site and recent news first.'),
    Q('Introduction', 'Why do you want to work in the geolocation, compliance or fraud-prevention space?', 'Tie it to something real: regulation, trust and safety, hard technical problems, or impact at scale.'),
    Q('Introduction', 'Where do you see yourself in five years?', 'Show ambition that fits the company: deepening expertise and growing responsibility, not leaving.'),
    Q('Introduction', 'What motivates you at work?', 'Give one concrete example of a moment you felt energised, not a list of buzzwords.'),
    Q('Behavioral', 'Tell me about a time you faced a difficult technical problem and how you solved it.', STAR + ' Explain your debugging or decision process step by step.'),
    Q('Behavioral', 'Describe a time you disagreed with a teammate. How did you handle it?', 'Show respect and curiosity: how you listened, what data you used, and how you reached a decision together.'),
    Q('Behavioral', 'Tell me about a time you failed. What did you learn?', 'Pick a real, low-stakes failure. Spend half your time on what you changed afterwards.'),
    Q('Behavioral', 'Describe a time you worked under a tight deadline.', STAR + ' Mention how you prioritised and communicated risk early.'),
    Q('Behavioral', 'Tell me about a time you had to learn something new very quickly.', 'Describe your learning method (docs, mentors, small experiments) and how fast you became productive.'),
    Q('Behavioral', 'Describe a time you took initiative beyond your job description.', STAR + ' Make the result tangible: time saved, errors reduced, people helped.'),
    Q('Behavioral', 'Tell me about a time you received critical feedback. How did you respond?', 'Show you listen without defending, act on it, and followed up to confirm improvement.'),
    Q('Behavioral', 'Describe a time you had to explain a complex idea to a non-technical person.', 'Highlight analogy, avoiding jargon, and checking understanding.'),
    Q('Behavioral', 'Tell me about a mistake you made that affected other people. What did you do?', 'Own it quickly, say how you limited the damage, and what process change prevents a repeat.'),
    Q('Behavioral', 'Describe a time you had to juggle several competing priorities.', 'Name your prioritisation framework (impact vs. urgency) and how you aligned stakeholders.'),
    Q('Situational', 'A client reports that legitimate customers are being wrongly blocked by a location check. What do you do?', 'Acknowledge urgency, gather evidence (logs, device, time, location signals), reproduce, mitigate, communicate regularly, then fix the root cause.'),
    Q('Situational', 'You discover a serious bug in production right before a release. What are your next steps?', 'Assess severity and blast radius, tell the right people immediately, propose a rollback or fix, and document the follow-up.'),
    Q('Situational', 'You are asked to implement a regulatory requirement that seems unclear. How do you proceed?', 'Clarify with compliance or legal, write down assumptions, build the smallest safe version, and get sign-off.'),
    Q('Situational', 'A teammate is not pulling their weight and it is affecting the project. What do you do?', 'Start with a private, empathetic conversation, offer help, and only escalate if the issue persists.'),
    Q('Situational', 'You must choose between shipping fast and shipping with higher quality. How do you decide?', 'Talk about risk, reversibility, customer impact, and agreeing explicit quality bars.'),
    Q('Situational', 'How do you work when requirements are ambiguous or keep changing?', 'Show you ask clarifying questions, deliver in small iterations, and keep stakeholders in the loop.'),
    Q('Role Fit', 'What is your greatest strength?', 'Pick a strength relevant to the job and prove it with a one-sentence example.'),
    Q('Role Fit', 'What is your greatest weakness?', 'Choose a genuine but non-critical weakness and describe what you are doing to improve it.'),
    Q('Role Fit', 'Why should we hire you?', 'Summarise three points: relevant skills, proven results, and genuine interest in this company.'),
    Q('Role Fit', 'How do you stay current with technology and industry changes?', 'Name specific sources, projects or communities, and something recent you learned.'),
    Q('Role Fit', 'How do you stay productive and connected when working remotely or in a hybrid team?', 'Mention written communication, clear status updates, and proactive check-ins.'),
    Q('Role Fit', 'Tell me about a time you handled sensitive or confidential information.', 'Emphasise integrity, least-privilege access, and following policy even when inconvenient.'),
    Q('Role Fit', 'What would your last manager say about you?', 'Be specific and honest: quote or paraphrase real feedback you have received.'),
    Q('Closing', 'Describe your ideal work environment and team culture.', 'Describe behaviours (collaboration, ownership, learning) rather than perks, and connect to what you know about the company.'),
    Q('Closing', 'Do you have any questions for us?', 'Prepare two or three: how success is measured in the first 90 days, team structure, and biggest current challenge.')
  ];
  list.forEach((q, i) => { q.id = 'iv-' + String(i + 1).padStart(2, '0'); });
  root.INTERVIEW = list;
  if (typeof module !== 'undefined') module.exports = list;
})(typeof window !== 'undefined' ? window : globalThis);
