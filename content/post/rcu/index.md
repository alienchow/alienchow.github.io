+++
date = '2024-11-02T07:35:11+08:00'
draft = false
title = 'RCU is Pretty Cool'
categories = ['Random']
tags = ['rcu', 'feature flags', 'lock-free']
+++

## "Do you know what is read-copy-update?"

[Balázs](https://www.linkedin.com/in/balazs-dezso/) randomly mumured on a Friday
afternoon while I was doom scrolling the endless stream of despair on Memegen
some time shortly after the
[Jan 2023 layoffs](https://blog.google/inside-google/message-ceo/january-update/).
Friday wasn't one of the team designated RTO days, but I decided to work from
office anyway for some focus time, as few people would be coming in.

_**B: "It's pretty cool."**_

Balázs proceeded to explain to me that read-copy-update, or RCU, is a lock-free
mechanism to update data structures that are actively being consumed by
asynchronous readers without the usage of locks. It was first introduced into
the Linux kernel
[back in 2002](https://mirrors.edge.kernel.org/pub/linux/kernel/v2.5/ChangeLog-2.5.43),
but discussions and designs date back to the
[mid 90s](https://worldwide.espacenet.com/patent/search/family/022246250/publication/US5442758A?q=pn%3DUS5442758).
The general idea is that instead of applying a mutex lock to update an
asynchronously read data structure, instantiate a copy of the existing data
structure and apply changes to the new instance. After the changes are applied,
do an atomic update of the pointer from the old instance to the new one. This
essentially creates a lock-free update of data change.

_**Me: "But wouldn't the updating of the pointer itself also require a lock?"**_

_**B: "Not in the Linux kernel. The kernel uses a counter to track all readers.
It only updates the pointer when there are no more readers."**_

_**Me: "Okay that's pretty cool."**_

_**B: "Pretty cool."**_

_**Me: "..."**_

_**B: "..."**_

After heading back to my seat from his window seat overseeing Credit Suisse
bankers sipping cocktails on the terrace of their bankruptcy embroiled office, I
decided to go read up a bit more about RCU. I think I got the gist of it and
will try to explain it myself.

Typically when writing a program using parallelism or concurrency, we wouldn't
want to do something like this:

```golang
type FeatureFlags struct {
    configs map[string]bool
}

func(f *FeatureFlags) Update(newConfig map[string]bool) {
    f.configs = map[string]bool{}
    for k, v := range newConfigs {
        f.configs[k] = v
    }
}

func(f *FeatureFlags) Get(config string) (bool, error) {
    if result, ok := f.configs[config]; ok {
        return result, nil
    }
    return false, errors.New("invalid config")
}
```

The `Update` method is performing a pointer update that can be accessed
asynchronously by multiple goroutines, which would result in race conditions. To
prevent such errors, we may choose to use a mutex lock.

```golang
type SimpleMutexConfigs struct {
	m sync.RWMutex
	configs map[string]bool
}

func(c *SimpleMutexConfigs) Update(newConfigs map[string]bool) {
	c.m.Lock()
	defer c.m.Unlock()
	
	c.configs = map[string]bool{}
	for k, v := range newConfigs{
		c.configs[k] = v
	}
}

func(c *SimpleMutexConfigs) Get(config string) (bool, error) {
	c.m.RLock()
	defer c.m.RUnlock()

	if result, ok := c.configs[config]; ok {
		return result, nil
	}
	return false, errors.New("invalid config")
}
```

`RLock()` is a reader lock that multiple async goroutines may concurrently hold.
`Lock()` is a write lock that blocks all read and write locks until it is
unlocked. This would successfully prevent race conditions, but when you have a
program that is high in reads, you create reader pileups leading to latency
spikes every time there's a config update. This would be especially pronounced
in a system with high read requests of large configuration data structures.

Going by RCU logic, we could a make a copy before safely updating the pointer to
the new config data structure.

```golang
type PseudoRCUMutexConfigs struct {
	m sync.RWMutex
	configs map[string]bool
}

func(c *PseudoRCUMutexConfigs) Update(newConfigs map[string]bool) {
	copyConfigs := map[string]bool{}
	for k, v := range newConfigs{
		copyConfigs[k] = v
	}

	c.m.Lock()
	defer c.m.Unlock()
	c.configs = copyConfigs
}

func(c *PseudoRCUMutexConfigs) Get(config string) (bool, error) {
	c.m.RLock()
	defer c.m.RUnlock()
	if result, ok := c.configs[config]; ok {
		return result, nil
	}
	return false, errors.New("invalid config")
}
```

The above would achieve the basic idea of RCU. It is not entirely accurate since
actual RCU would have a queue of updates waiting for a kernel grace period
before updating in sequence. Not to mention that the write lock for the pointer
updates is still a blocking lock. We could possibly play around with Golang's
`atomic` library to give a more accurate representation, but I think these
examples are close enough.

### Let's run some [benchmarks](https://github.com/alienchow/benchmarks/blob/main/go/fake_rcu/main_test.go)!

---

We want to test the performance of reads for:
* Simple RW Mutex locking.
* Pseudo RCU where we only do a lock to update the pointer.
* Performance of small vs large configs.
* Performance of reads based on frequency of updates.

It would be pretty clear that by shifting the mutex write lock to safeguard just
the pointer update, we would be able to obse...

```
BenchmarkSimpleMutex/Update_Small_Config_frequent-8  4759899   253.5 ns/op
BenchmarkSimpleMutex/Update_Small_Config_seldom-8    5074174   237.0 ns/op
BenchmarkSimpleMutex/Update_Large_Config_frequent-8  4116626   289.5 ns/op
BenchmarkSimpleMutex/Update_Large_Config_seldom-8    5048846   238.9 ns/op
BenchmarkPseudoRCU/Update_Small_Config_frequent-8    4667325   255.6 ns/op
BenchmarkPseudoRCU/Update_Small_Config_seldom-8      5063089   239.1 ns/op
BenchmarkPseudoRCU/Update_Large_Config_frequent-8    4453814   268.4 ns/op
BenchmarkPseudoRCU/Update_Large_Config_seldom-8      5054824   238.5 ns/op
```

...👀

The shifting of the write lock to include just the pointer update only
significantly matters if the config update is incredibly frequent (every 5
nanoseconds), and if the configuration to be copied is large. Such frequency of
changes is rare, not to mention that the traditional kernel RCU wasn't really
built for frequent updates due to the piling up of updates awaiting grace
periods. Decreasing the updates to 1 per second has already led to no difference
between either methods of implementation.

This does not conform to my preconceived notions, I must juke the data.

```golang
type AtomicRCUConfigs struct{
	configs atomic.Value
}

func(c *AtomicRCUConfigs) Update(newConfigs map[string]bool) {
	copyConfigs := map[string]bool{}
	for k, v := range newConfigs{
		copyConfigs[k] = v
	}
	c.configs.Store(copyConfigs)
}

func(c *AtomicRCUConfigs) Get(config string) (bool, error) {
	currentConfigs, ok := c.configs.Load().(map[string]bool)
	if !ok {
		return false, errors.New("invalid config state")
	}

	if result, ok := currentConfigs[config]; ok {
		return result, nil
	}
	return false, errors.New("invalid config")
}
```

There we go. Now that we have entirely stripped out the _eXpEnSiVe_ mutex locks
in Golang by swapping in atomic operations, we would be able to confirm my
biases.

```
BenchmarkSimpleMutex/Update_Small_Config_frequent-8   4757412   253.7 ns/op
BenchmarkSimpleMutex/Update_Small_Config_seldom-8     5080617   238.4 ns/op
BenchmarkSimpleMutex/Update_Large_Config_frequent-8   4214394   287.1 ns/op
BenchmarkSimpleMutex/Update_Large_Config_seldom-8     4991079   241.7 ns/op
BenchmarkPseudoRCU/Update_Small_Config_frequent-8     4639545   257.1 ns/op
BenchmarkPseudoRCU/Update_Small_Config_seldom-8       4944051   242.6 ns/op
BenchmarkPseudoRCU/Update_Large_Config_frequent-8     4428478   272.5 ns/op
BenchmarkPseudoRCU/Update_Large_Config_seldom-8       4927450   243.6 ns/op
BenchmarkAtomicRCU/Update_Small_Config_frequent-8     4776242   251.7 ns/op
BenchmarkAtomicRCU/Update_Small_Config_seldom-8       4967343   241.9 ns/op
BenchmarkAtomicRCU/Update_Large_Config_frequent-8     4559646   264.2 ns/op
BenchmarkAtomicRCU/Update_Large_Config_seldom-8       4966724   240.7 ns/op
```

...👀

It would appear that if the frequency of updates is anywhere grounded in
reality, the optimisation gains are entirely inconsequential regardless of the
size of the data.

{{< img src="benchmarks_dont_matter.jpg" alt="points don't matter" >}}

Given how performant Golang is, I think we can limit such inane optimisations
to the kernel.

RCU is still pretty cool though. 🛌 
