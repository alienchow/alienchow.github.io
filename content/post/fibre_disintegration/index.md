+++
date = '2026-01-11T11:11:50+08:00'
draft = false
title = 'My Home Fibre Network Disintegrated, Literally'
categories = ['Homelab']
tags = [
    'rip',
    'homelab',
    'networking',
    'fibre',
    'fiber',
    'renovation',
]
+++

This morning I woke up and headed to my bomb shelter to grab the bike pump to inflate the tyres on my children's bikes. The handle got slightly tangled up in the fibre optic cables so I lifted up the cables to free the pump.

Like cookie crumbs the fibre cable's sleeve jackets crumbled in my hands.

---

{{< img src="fibre_disintegration/fibre_jacket_crumbling.jpg" alt="fibre no more" >}}

---

Before I could even utter "Oh fuck no", another section of the cable exploded outwards with thin metal wires jutting out from what seems to be like strands of white plastic threads, which I assume is the Kevlar sheath. I think I must have stood in my pseudo server room in shock for a whole minute, unable to move or process what had happened. A main component of why I was in sheer horror was the fact that I had stupidly buried all of these cables under my cement flooring in PVC trunking from my shelter to all of the rooms in the flat. If this cable fails, the connection from the server room to a specific room would be permanently severed. The room for this particular cable turned out to be my home office where my homelab MS-A2 resided.

I had purchased these cables from [FS.com](https://www.fs.com/sg/products/70220.html) roughly 3.5 years ago in 2022. Because I was burying the cables underground permanently, I opted to get the **MiLiTaRy GrAdE** armoured fibre cables for this purpose.

---

{{< img src="fibre_disintegration/original_order.png" alt="MILITARY GRADE" >}}

---

The cables had been kept spooled up with a radius of around 5cm for 3 whole years, lightly tied together with hook and loop cable fasteners and hung on laundry hooks in the shelter all this time.

---

{{< img src="fibre_disintegration/organisation.jpg" alt="How cables were stored" >}}

---

The destroyed cable is the only one that I had unravelled recently to patch into my UDM to enable SFP+ connection to my office space. As it turns out, armoured cables in this specific instance aren't really meant for movement, it's likely more of a bury and forget purpose. In hindsight I should've connected all of the cables to a fibre patch panel on the wall so that they would never move, then connect the patch panel to my UDM with easily replaceable LSZH cables.

But it's too late now, all I can do is to salvage the situation. I headed out and purchased 3M self-bonding rubber electrical tape 23, and Temflex 160 vinyl electrical tape. The idea I had was to use the compression properties of the stretched rubber tape to hold the corrugated metal sheath and wire mesh in place, before wrapping a second vinyl protection layer outside with the 160.

---

{{< img src="fibre_disintegration/wrap.jpg" alt="wrapping away" >}}

---

However, the wrapping process itself requires me to slowly shift the cable around to hook onto higher ground to prevent kinks. The action itself triggered more jacket failures. Some of the failures actually forced the cable in a sharp right angle, which I am almost certain has caused kinks and cracks in the inner fibre strand. RIP.

---

{{< img src="fibre_disintegration/shit.jpg" alt="shit" >}}

{{< img src="fibre_disintegration/shit_shit.jpg" alt="shit shit" >}}

{{< img src="fibre_disintegration/shit_shit_shit.jpg" alt="shit shit shit" >}}

---

At this point, I'm looking at rebuilding the entire sleeve jacket of anything that's exposed and movable with electrical tape. What I had previously thought was a good idea to keep about 5-10m of slack to allow me to easily move my server rack around is now causing me more problems as good electrical tape ain't cheap. I have to essentially repair around 10 metres of jacket without accidentally destroying parts inside trunking that I am unable to reach. This is assuming that the 4 other untouched cables wouldn't spontaneously crumble as well. Based on how they felt in my hand, I think it is an inevitable outcome.

I'm pretty certain that datacentre technicians reading this by chance would mock my idiotic setup and I would be inclined to join in. This is not a good day.

On the dim side of things, at least it seems like fibre optic cables are pretty hardy. My MS-A2 SFP+ connection is still working and `speedtest-cli` is reporting around 4000/3000 Mbps up/down speeds to my ISP (10G fibre internet plan). UDM is seeing 6000/7000, so the fibre cable is definitely compromised. :(
