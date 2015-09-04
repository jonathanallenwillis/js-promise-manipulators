
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



