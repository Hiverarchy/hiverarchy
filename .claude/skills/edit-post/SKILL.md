---
name: edit-post
description: Edit and refine existing Hiverarchy blog posts. Use when user wants to revise content, fix tone issues, update facts, or improve an existing post.
---

# Edit Hiverarchy Post

Retrieves, edits, and updates existing blog posts in the Hiverarchy platform.

## Voice: Write Like You Talk

The goal is writing that sounds like a real person thinking out loud - not a polished blog post trying to impress anyone.

**The voice is:**
- A veteran developer (35 years: C#, SQL Server, Angular, React, Vue) who's now building AI systems
- Confident about software craft - he knows how to build things right
- Newer to AI specifically, but applying solid engineering principles
- Conversational, sometimes rambling, circling back to the point
- Honest about what's deployed vs. what's built-and-ready

**The voice is NOT:**
- A thought leader positioning himself
- A consultant showcasing client results he doesn't have
- Marketing copy with rough edges sanded off
- An AI trying to sound human (ironic, but important)
- Tentative about technical decisions - he's experienced enough to have opinions

## The Author's Real Background

This matters for knowing what can be claimed with authority:

**35 years of real experience:**
- Microsoft technologies, C#, SQL Server
- Front-end: Angular, React, Vue
- Production software architecture and deployment
- Building maintainable, scalable systems

**OrchestratorAI is real:**
- A well-made, production-quality application
- Built with solid engineering principles
- The technical implementation is sound

**What's NOT claimed:**
- Client deployments of AI systems
- Business results and ROI from AI projects
- "I've seen companies..." stories

**The right tone for caveats:**
- NOT: "I don't know if this works" (too uncertain)
- YES: "I've built this, it's solid, I just haven't deployed it at scale for clients yet"
- The architecture is proven. The AI-specific deployment results aren't.

**The right tone for summaries/conclusions:**
- Show competence AND continued growth - not one or the other
- "35 years of shipping software" is real authority - use it
- "I'm learning fast, but I'm learning" - honest about the growth edge without being self-deprecating
- Avoid pure humility ("I don't really know") - that undersells real expertise
- Avoid pure confidence ("I've figured this out") - that overclaims on AI-specific experience
- The sweet spot: someone who's good at their craft and expanding into new territory with eyes open
- "That's the honest position" - own it confidently, don't apologize for being in motion

## The Made-Up Experience Problem

This is critical. The posts cannot claim experience that doesn't exist.

**Bad patterns:**
- "A client I worked with..." (fictional)
- "I've seen teams struggle with..." (vague, probably made up)
- "In my consulting work..." (implies client work that may not exist)
- "One company I helped..." (fake case study)

**Also bad - the "potential" pivot:**
- "Consider a typical company that could..." (still marketing)
- "The potential ROI is..." (hand-wavy projections)
- "What success could look like..." (aspirational nonsense)

**What to do instead:**
- If you have real experience building OrchestratorAI, talk about that specifically
- If it's research or reading, say so: "From what I've read..." or "The research suggests..."
- If it's theory, own it: "I think this would work because..." or "My hypothesis is..."
- If you don't have anything real to say, maybe that section shouldn't exist

**Research-based knowledge is fine:**
- "The debates I've seen in the research about cloud vs. on-prem..." - valid
- "Patterns that work in production, based on what I've studied..." - valid
- "What I've learned researching how others handle this..." - valid
- The author does extensive research - that's real knowledge, just be honest about the source
- Don't pretend research is direct client experience, but don't undersell it either
- Research + building OrchestratorAI = legitimate expertise, just framed honestly

## Detecting Marketing Speak

Marketing writing has tells. Watch for:

**Structural tells:**
- Everything organized into neat numbered lists
- "Here's why..." or "Here's the thing..." setups
- "What [X] looks like" section headers
- Perfect problem → solution → results arcs
- Every section builds to a satisfying conclusion
- Bullet points for everything

**Phrase tells:**
- "Let me tell you about..."
- "I get it." (false empathy opener)
- "The real goal is..."
- "Game changer" / "transformation" / "unlock"
- "Based on my research..." (performative)
- "The pattern I've found effective..." (consultant-speak)
- Anything that sounds like a LinkedIn post

**Flow tells:**
- Every paragraph transitions smoothly to the next
- No rough edges or incomplete thoughts
- Everything wraps up with a bow
- Too clean, too polished, too structured

## What Natural Writing Sounds Like

Real people writing about what they know:
- Start in the middle sometimes
- Go on tangents and circle back
- Use "and" and "but" to start sentences
- Leave some thoughts incomplete
- Admit uncertainty
- Don't wrap everything up neatly
- Have opinions without hedging everything
- Sound like they're explaining to a friend, not presenting to a conference

**Sentence rhythm matters:**
- Vary sentence length. Short sentences punch. But longer sentences that connect a few ideas together with commas and dashes feel more like actual thinking - the way you'd explain something verbally, circling around the point before landing on it.
- Uniform short sentences are an AI tell. They create a choppy, staccato rhythm that sounds robotic.
- Let some sentences run. Use dashes, use commas, let thoughts connect before the period.
- Then hit a short one for emphasis.
- Read it out loud - does it sound like talking or like bullet points converted to prose?

**Example - Marketing voice:**
"When implementing multi-tenant agent orchestration, the key challenge is balancing isolation with efficiency. Here's what I've found works: a three-tier approach that provides security boundaries while maintaining resource optimization."

**Example - Natural voice:**
"Multi-tenant is tricky. You want isolation - obviously, one customer's data can't leak to another. But if you spin up completely separate infrastructure for everyone, costs explode. I've been wrestling with this in OrchestratorAI. The answer I landed on isn't elegant, but it works."

## Getting the Post ID

When invoked from the web panel with post context:
- The system provides "Current Post ID" in the context
- Use this ID automatically unless the user specifies a different one

When invoked without context:
- Ask the user for the post ID or title to search for
- Use the Supabase API to look up posts by title if needed

## Workflow

```
1. Fetch the post (using context post ID or user-provided ID)
2. First pass - Fix obvious issues:
   - Made-up client/customer stories
   - "we" to "I", "our" to "my"
   - Verbal tics ("Look,", "Here's the thing")

3. Second pass - Check for marketing structure:
   - Too many bullet lists?
   - Too neat and organized?
   - Every section has a perfect arc?
   - Headers that sound like a webinar?

4. Third pass - Read it out loud (mentally):
   - Would a real person say this?
   - Does it sound like talking or presenting?
   - Are there any sentences you'd never actually speak?
   - Does it flow like thought or like a template?

5. FINAL STEP - Full rewrite check:
   Ask: "If I read this cold, would I think a person wrote it or an AI?"
   If AI, rewrite sections until they sound human.
   This may mean:
   - Breaking up perfect structure
   - Adding a tangent
   - Leaving something unresolved
   - Making it a little messier

6. Present to user for review
7. Update in Supabase when approved
```

## The Final Edit Step (Critical)

Before presenting the edited post, do one more pass asking:

1. **Experience check**: Every claim of experience - is it real? If not, reframe or cut.

2. **Marketing check**: Read each section. Does it sound like it's trying to sell something or impress someone? Rewrite until it doesn't.

3. **Flow check**: Read the whole thing. Does it flow like someone talking through their thoughts, or like a structured presentation? Add roughness if needed.

4. **The friend test**: If you were explaining this to a friend who asked "what do you think about X?", would you say it this way? If not, how would you actually say it?

## API Details

**Fetch post:**
```bash
curl 'https://ssqyknqsfdtdxqocaiwm.supabase.co/rest/v1/posts?id=eq.POST_ID&select=*' \
  -H 'apikey: SERVICE_KEY'
```

**Update post:**
```bash
curl 'https://ssqyknqsfdtdxqocaiwm.supabase.co/rest/v1/posts?id=eq.POST_ID' \
  -X PATCH \
  -H 'apikey: SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"content": "updated markdown..."}'
```

## Example Transformation

**Before (marketing voice):**
```
## What Success Looks Like

Consider a typical SMB with a 3-person support team handling 200 inquiries daily. With an AI assistant that handles routine questions and escalates complex issues:

- AI handles 70-80% of routine inquiries
- Response time drops from hours to minutes
- Staff reallocates to higher-value work
- Customer satisfaction improves

This is exactly the kind of workflow OrchestratorAI is designed for.
```

**After (natural voice):**
```
## Does This Actually Work?

I haven't deployed this for a client - I should be upfront about that. But I've built the routing logic in OrchestratorAI, and the pattern is solid. Simple questions go to a fast, cheap model. Anything ambiguous gets flagged for a human.

The theory is straightforward: most support questions have known answers. The tricky part is knowing which questions are actually simple. I'm still tuning that. The model's confidence score helps, but it's not perfect. Sometimes it's confident and wrong.

Would I bet on 70% automation? Maybe. Depends on the domain. Some businesses have messier questions than others.
```

**Why it's better:**
- Admits what's real experience vs. theory
- Doesn't claim results that haven't happened
- Shows actual uncertainty
- Sounds like someone thinking, not presenting
