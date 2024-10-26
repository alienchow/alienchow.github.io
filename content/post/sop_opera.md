+++
date = '2024-10-26'
draft = false
title = 'Debugging SRE #1: SOP Opera'
+++

## Reliability Theatrics Galore

In recent months, I have observed several troubling anti-patterns carried out
by team operations:

* Release engineer accidentally skipping a step during deployment causing an
incident.
* Hastily written, obligatory post-mortem reports with action items involving
adding more steps to the standard operating procedure (SOP), to check the check
that was missed during a check.
* No one knew how to roll back a service because no one knew where the SOP was.
* A service was penalised for not following a handful of the thousands of lines
of security and reliability SOP.

The recurring commonality in all the above is the reliance on SOP. SOP has its
place for basic sanity checks and release approvals, but it is increasingly
apparent that teams have been using it as a crutch to weasel out of building
scalable, long-term solutions.

An example would be the aforementioned incident caused by skipping a step in
SOP. The resulting incident post-mortem had a series of follow-up action items
that were merely adding on more manual checking steps to the SOP! This hasn't
been a one-off scenario. When I broached this anti-pattern with the relevant
teams, the usual excuses were:

> *"No time to automate, features come first."*
> *"It's a one-off and won't happen again."*
> *"SOP has been working for us, so there is no reason to automate it."*

Most egregious excuse of all:
> *"Automation makes us ignorant to operations. We need to do it by hand to
> to check each command with our eyeballs."*

---

**By that logic, everyone should write bytecode to fully understand their
software.**

---

## Humans Cannot Be Trusted

I have seen a highly competent SWE accidentally cause a global outage because of
a trailing whitespace fat-fingered into a hand typed command with implicit
behaviour. The automation for the action hadn't existed for that specific
incident response, and it had been a busy day. In the midst of an
adrenaline-charged mitigation attempt, the engineer brought down multiple
clusters of the service.

You could argue that maybe that meant that the engineer isn't as competent as I
had perceived. But I took that to mean that humans, regardless of competency,
cannot be trusted to reliably repeat a list of executions. Depending on SOP to
carry out some basic commands by hand is a recipe for eventual failure.

## Machines Cannot Be Trusted

To give credit where its due, automation **can** in fact introduce unpredictable
behaviour due to unexpected behaviour. I once automated a migration workflow
that executed the following simple actions:

1. Load updated quota numbers from the single source of truth quota service.
1. Sync the updated quota numbers to our new resource management service.

Since we were migrating hundreds of thousands of internal users, I didn't trust
myself to reliably run the command arguments correctly every single time. I set
up the automation, sharded the users into migration batches, each with canary
subgroups and hit start.

After monitoring the dashboards and alerts for an hour, I was pleased with how
well everything was going and left for lunch. I received a page 20m later.

> "Hey, your migration took down our largest services and the alerts are going
nuts."

As it turned out, the quota service had a quirk in its behaviour. It provided
quota numbers by loading the data from multiple other sources. And if any of the
sources threw an error, it did not propagate that error. Instead, it failed
silently while confidently returning `quota: 0, status: SUCCESS`. You can see
where this is going.

The canary groups had migrated without issues. The migration of the large users
coincided with data source errors, leading to the quota service authoritatively
telling my automation that there were no quotas. Servers started spinning down,
and clients experienced massive load shedding.

The resulting action items involved introducing hard stops that checked for
large quota deltas and changes reducing quota to 0, and a myriad of other
preventive actions.

But it had never crossed our minds that we should throw the entire automation
out to run the migration by hand. **The safety checks put in place were still
automated.**

## Scalability - Beyond Just System Architecture

Some SOPs have incredibly simple, low hanging fruit such as:

* Go to `www.example.com` and check if webpage loads.
* Restart dependency service before deployment.
* Copy new certificates (by hand 😒), and SSH in to run a curl test.
* Ask a second person to go through all steps one by one.

Look, these aren't magical, human-necessary operations that require esoteric
brain heuristics to analyse and execute. They are dead simple steps that create
[toil](https://sre.google/sre-book/eliminating-toil/).

This brings us to one of the commonly overlooked aspect of the word
`scalability`. When SRE teams discuss service scalability, you have
non-practicing AWS/GCP/Azure certified solutions architects jumping out of
the woodwork preaching the usual basic concepts like stateless tasks, event
driven design, eventual consistency etc. Rarely discussed is the scalability of
processes.

The ironic truth is that many of these certified architects work on low traffic
services that have less need for service scalability as opposed to the
scalability of the operations team.

A key principle taught to SREs in Google through implicit observation is to grow
a service with sublinear SRE support. The main ingredient enabling that
scalability of processes is undoubtedly **automation**.

## Scaling Processes

When we find ourselves adding yet another step in a growing list of lines of an
SOP, ask ourselves a few questions:

1. Is this step really needed?
1. Can this step be automated?
1. Can there be a more scalable way to automate these steps without snowflake
script spaghetti?
1. Is this really a one-off? Can even a one-off event benefit from eliminating
human toil?

> **NOTE**
>
> A single additional step in an SOP is insignificant increment in toil, but a
> culture of using SOP as a crutch is a snowballing avalanche.

When we find ourselves in yet another post-mortem review, question the reliance
humans to follow instructions. Question any action items that involve just
adding on to SOP. Stop using SOP as theatrical, performative reliability
diligence.

If the argument against automation despite the above is a lack of time, then the
SRE function, in whatever form it may take on in the organisation, isn't
properly set up to succeed. The priorities are clearly misplaced.
