[![Build Status](https://travis-ci.org/jonjitsu/js-promise-manipulators.svg?branch=master)](https://travis-ci.org/jonathanallenwillis/js-promise-manipulators) [![Coverage Status](https://coveralls.io/repos/jonathanallenwillis/js-promise-manipulators/badge.svg?branch=master&service=github)](https://coveralls.io/github/jonathanallenwillis/js-promise-manipulators?branch=master) 
# Promise manipulators

A set of functions that can be used to alter promise producing functions.

## Simple example:

Assume a function getIpInfo performs a jsonp call to a webservice which returns data such as:

```
{
    "isp": "your isps name",
    "ip": {
        "v4": "1.2.3.4"
        "v6": "2001:db8:85a3:0:0:8a2e:370:7334"
    }
}
```

The following call would display the ISP's name following the call to the webservice:

```
getIpInfo().then(showIspName);
```


We could memoize it so as to only make the actual webservice call once:

```
var memoedGetIpInfo = memoize(getIpInfo);

memoedGetIpInfo().then(showIp);
```


The memoed version works exactly like the original.


Let's assume we are replacing a similar call in an existing web app which assumes the return format is:
 
 ```
 {
    "ispName": "your isps name",
    "ipv4": "1.2.3.4"
    "ipv6": "2001:db8:85a3:0:0:8a2e:370:7334"
}
```

we could do:

```
getIpInfo = flatten(newGetIpInfo, "")
```

memoed:

```
getIpInfo = memoize(flatten(newGetIpInfo, ""))
```

resulting in no other modifications in the app since the the getIpInfo works exactly the same.


## TODO
- [X] Add fluent interface
- [ ] Make fluent interface more efficient. Use more oop stateful approach.
- [ ] Make API more consistent

### Add fluent interface
```
var newGetIpInfo = flatten(getIpInfo, "")
 			  .remap({ipv4: 'ip})
			  .pluck(['isp', 'ip'])
			  .memoize();

newGetIpInfo()
	.then(function(ipInfo) { console.log("IP: " + ipInfo.ip + " ISP: " + ipInfo.isp); });
```

### Make API more consistent
Some functions operate on the result and some functions work on the promises before hand.

There's a reduce for the result and a reduce for combining the promises which doesn't make sense.
