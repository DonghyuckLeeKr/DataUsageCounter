# Code signing policy

Free code signing is intended to be provided by [SignPath.io](https://signpath.io/), certificate by [SignPath Foundation](https://signpath.org/), subject to project acceptance and service availability.

## Roles

- Committer and reviewer: [DonghyuckLeeKr](https://github.com/DonghyuckLeeKr)
- Signing approver: [DonghyuckLeeKr](https://github.com/DonghyuckLeeKr)

External contributions require review by the maintainer before merge. Every production signing request requires manual approval by the signing approver. Release tags must match the application version and originate from the public repository's reviewed source and build workflow.

## Release integrity

- Automatic-update archives are signed with the project's Tauri updater key and verified by the public key embedded in the application.
- Authenticode signing, when enabled after SignPath approval, is performed only on artifacts produced by the repository's automated Windows release workflow.
- Private updater keys, certificate material, and passwords are never committed to the repository.
- Published installers must report the DolphinData product name and a version matching the source release.

See the [privacy policy](../PRIVACY.md) for local data storage and network behavior.
