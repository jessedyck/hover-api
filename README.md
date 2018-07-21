# hover-api-promise

Hover DNS api client with Promises, adapted from inspired completely by [Hover API by Steven White](https://github.com/swhite24/hover-api).

## Usage

```javascript
var hover = require('hover-api-promise')('username', 'password');

hover.getAllDomains().then(domains => {
    console.log(domains);
});
```

## API

* getAllDomains()
* getAllDns()
* getDomain(domain)
* getDomainDns(domain)
* createARecord (domain, subdomain, ip)
* createMXRecord (domain, subdomain, priority, ip)
* updateDomainDns (dns, ip)
* removeDns (dns)

## License

See [LICENSE](LICENSE)
