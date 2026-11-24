# Measuring business impact

The objective is to reduce repetitive monitoring effort and shorten the time acquisition-blocking defects remain live. Do not equate flags detected with revenue generated.

| Measurement | Method |
|---|---|
| Manual minutes | Time a comparable manual check and report across the same URLs and signals. |
| Automated minutes | Time human review and triage; log machine runtime separately. |
| Hours saved | (manual minutes - automated human minutes) × comparable cycles / 60. |
| Estimated labour value | Hours saved × agreed loaded hourly cost. |
| Detection latency | first detection timestamp - known incident onset; label unknown onset. |
| Resolution time | independent verified resolution - first detection. |
| Alert precision | confirmed actionable incidents / reviewed flags; separate review candidates. |
| Acquisition exposure | Join affected landing URLs and incident intervals to organic landing-page sessions. |

Example (assumptions only): 115 manual minutes and 15 exception-review minutes gives 100 minutes saved per cycle, or 86.96%. At four comparable cycles, that is 6.67 hours, excluding implementation time and setup/maintenance cost. Record actual timings before claiming savings.

For a revenue case, join aggregated analytics landing-page sessions and conversion events to CRM application/enrolment records using consented, authorized attribution fields. Compare baseline vs incident periods while accounting for seasonality, campaign shifts and traffic mix. An exposure scenario can use affected organic sessions × baseline lead rate × baseline lead-to-enrolment rate × average net enrolment revenue. This is an estimate of exposure, not measured lost revenue. No CRM connection or real revenue result is included here.
