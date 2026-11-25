# Parcel Bench

Compare eligible Canada Post consumer counter rates for domestic Canadian parcels, expected delivery dates, and a second box size. Find nearby post offices, load their opening hours and open an outlet map.

[Use Parcel Bench](https://coolcode.ca/parcelbench/)

<!-- coolcode:guide -->
Enter the two postal codes, packed weight, dimensions and mailing date. Add an arrive-by date to flag returned estimates that fit it. Compare the same contents in a smaller box to see the price difference for services available to both. Quotes use consumer counter rates; a future mailing date changes the delivery estimate, not the quote’s price date. Save a plan only if you want it retained on this device. Post office hours are not parcel acceptance cutoffs.
<!-- /coolcode:guide -->

## Source and interpretation

The production JSON [Canada Post Rating API](https://developer-developpeur.canadapost-postescanada.ca/devportal-portaildesdeveloppeurs/api/overview/rating) returns eligible services with prices, taxes, adjustments, volumetric weight and optional expected delivery dates/transit times. `quoteType` is explicitly `counter`; no `customerNumber` or commercial contract is sent. We do not promise a service is available unless returned for the entered parcel. A returned guarantee flag remains subject to Canada Post conditions and service disruptions; this tool does not promise arrival or Christmas delivery.

[Post Office Services](https://developer-developpeur.canadapost-postescanada.ca/devportal-portaildesdeveloppeurs/api/overview/postoffice) searches up to ten counters and fetches hours on request. When hours are unavailable here, use the official Canada Post finder link on the outlet card before visiting. This app cannot infer that the original source omitted hours, and unavailable hours are not evidence of closure. The API supplies opening hours, not acceptance cutoffs. Maps use OpenStreetMap only when requested.

Rates and locations are queried live through CoolCode's fixed-host, bounded gateway. There is no collector or refresh schedule. Failures show an actionable error rather than sample rates. Freshness is the API retrieval time, never the static site build time. No tracking, label purchase, address book or payment operation is exposed.

## API keys

Store secrets in the **shared Cloudflare Worker**, never this public repository or browser code:

| Worker secret | Value |
| --- | --- |
| `CANADAPOST_CLIENT_ID` | The production Developer Portal **API Key** |
| `CANADAPOST_CLIENT_SECRET` | Its matching **API Secret** |

The customer number is separate and is not required for these consumer counter quotes. The Worker exchanges the credentials for a short-lived OAuth2 bearer token using `client_credentials` and `merchant` scope. It calls the current production JSON Rating and Post Office products, not the retired XML/Basic API. The existing Worker `DB` binding supplies shared rate limiting; no new binding is needed. Worker source is maintained in `jsdyer/jsdyer.github.io/services/cloudflare-visitor/parcel-corporate-gateway.js` and included in the generated dashboard-pasteable `worker.js`.

## Privacy

Submitting sends postal codes, packed weight, dimensions and mailing date through the gateway to Canada Post. The target date stays in the browser. No customer number, name, street address or payment data is collected. Parcel replies are not stored in the gateway's shared response cache. OAuth tokens are kept only temporarily in Worker memory and never returned to the visitor. Request inputs or secrets are not logged by the application. Hosting providers may retain ordinary access logs.

Save explicitly retains only the form on this device under `coolcode:parcelbench:plan`; Restore reloads it after refresh and Forget removes it. No cookie or account is used. JSON exports contain the entered postal codes and dated quote response. Opening a map sends the outlet coordinates to OpenStreetMap. Shared browsers share saved plans.

## Expand or customize

Edit `web/config.json`: `presets` is an arbitrary list of labeled box dimensions (cm); `example` changes the optional starter form; `gateway` selects your own compatible deployment. The app derives preset buttons from that list and accepts any valid Canadian postal codes, weights up to 30 kg and dimensions up to 200 cm. Those input bounds do not imply every service accepts the parcel. Canada Post decides eligibility. Add a preset beyond the defaults and run the tests/build; no collector or source refresh is needed. API contract changes belong in the shared Worker and its gateway tests before updating the browser. Do not put a credential in config.

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -v
python3 scripts/build.py
python3 -m http.server 8000 --directory dist
```

The offline build versions the local CSS/module/config graph together. CI tests at a project subpath and deploys `dist/` to GitHub Pages from main; no CNAME belongs in this repository. The hub lifecycle reconciles the catalogue, sitemap, generated Worker IDs, audit and watchdog inventory. This app has no scheduled workflows; the existing watchdog does not need a new collector timer.
