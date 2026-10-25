# Local academic demonstration

This repository publishes the full final-year project for code review and local demonstration. It is not a production-ready multi-tenant service. Use generated sample orders and the disposable demo login only.

The original application stores passwords in plaintext, keeps sessions in process memory, enables development debugging, and needs a complete authorization review (including empty-user datasets and shared category/correction operations). It also needs stronger upload/resource limits, deployment configuration and automated security coverage before exposure to untrusted users. Do not enter real passwords, customer records or business data, and do not expose the Flask development server to the Internet.

The seeded `admin@opa.com` / `admin123` account is a deliberately public local demo account. Existing databases, historical uploads, API credentials and dependency folders are excluded from the repository. A clean database is created on first launch.

For private security reports, contact Wayne using the contact details on the portfolio rather than posting sensitive records in a public issue.
