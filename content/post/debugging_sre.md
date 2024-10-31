+++
date = '2024-10-26'
draft = false
title = 'Debugging SRE'
categories = ['Debugging SRE']
tags = ['sre']
+++

`Debugging SRE` is a series of low effort brain dumps, consisting of reliability
practices that I have observed, and to discuss anti-patterns masquerading as
reliability diligence.

After resigning from the Google tech island to practise Site Reliability
Engineering (SRE) elsewhere, I have come to realise that many organisations
fancy the branding and engineering credibility of a tech organisation that has
a dedicated SRE team.

Yet, few of the organisations that I've observed so far actually embrace the
full implementation of an SRE function. Many are just rebranded DevOps or IT
Sysadmins. More concerningly, some of these SRE orgs are made up of traditional
Ops Engineers who barely know how to code beyond copy pasting Bash or Powershell
scripts. The premise of the original Google SREs was to have SWEs work on ops
using software development perspectives, so as to bridge the divide between Dev
and Ops to focus on service stability.

During my talks with several SRE teams in other companies, some become defensive
about what actually constitutes SRE work. And that Google alone does not hold
the absolute definition of `Site Reliability Engineering`. To me, appointments
and titles are pointless debates over semantics. The crux of the matter is that
SRE work itself focuses on a few core principles that are often espoused, but
rarely implemented in proper. After a couple of recent catalytic events, I've
decided to start penning down my thoughts, for whatever the two cents they are
worth.
