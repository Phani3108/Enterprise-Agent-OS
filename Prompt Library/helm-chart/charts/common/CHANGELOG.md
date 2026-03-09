# Helm Commons

All notable changes to this project will be documented in this file.

## New Release

**Most recent release should on the top**
#### Release 1.0.118
Updated the template _hooks.tpl to support `envFrom` to mount configmap in the deployment hook job with .Values.deploymentHooks[0].envFrom
#### Release 1.0.117
Updated the template _deployment-springboot.tpl to avoid relying on short-circuit behavior for .Values.containerLifecycleControl.preStop
#### Release 1.0.116
Fixed nil pointer error in _deployment-springboot.tpl when containerLifecycleControl is not defined
#### Release 1.0.115
Ensures preStop hooks are rendered correctly when enabled in containerLifecycleControl, avoiding Helm rendering errors(_deployment-springboot.tpl)
#### Release 1.0.114
Added prestop hook handling in _deployment-springboot.tpl
#### Release 1.0.113
Added templates for Heracles V2 manifests 
#### Release 1.0.112
Added Templates library for Heracles V2 manifests  
#### Release 1.0.111
fix rendering of config section in HeraclesClusterRoute
#### Release 1.0.109
add fixes for heracles clusterroute config
#### Release 1.0.108
add fixes for heracles clusterroute
#### Release 1.0.107
add fixes for heracles pathrouter 
#### Release 1.0.106
fixes for heracles domain spec
#### Release 1.0.105
added changes to create multiple heracles objects in a single cluster 
#### Release 1.0.104
Improvement: Added Enable/Disable extensibility to deployment hooks.This change is made to _hooks.tpl.
#### Release 1.0.103
added helm templates for zone-traffic 
### Release 1.0.101
- BugFix: Updated common.atropos-ebs-tolerations helper function to be compatible with helm version 3.2 , as some old ci jobs are still using helm 3.2

### Release 1.0.100
- Improvement: Added initContainer ebs disk mount check for atropos EBS, this checks if the additional EBS volume is mounted or not and then modifies the file permissions as needed

### Release 1.0.99
- Improvement: Updated logic to merge atropos-ebs tolerations and affinity with deployment tolerations and affinity
  Atropos ebs affinity will be merged to deployment affinity in followng way when Atropos Ebs is enabled
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: gravition
            operator: In
            values:
              - enabled
        - matchExpressions:
          - key: amd
            operator: In
            values:
              - enabled
  The above affinity will be updated to
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: gravition
            operator: In
            values:
            - true
          - key: atropos-ebs
            operator: In
            values:
            - enabled
        - matchExpressions:
          - key: amd
            operator: In
            values:
            - true
          - key: atropos-ebs
            operator: In
            values:
            - enabled
  The default affinity of Atropos EBS can also be overriden using affinity section in enabledAtroposEbs, By design we only support merging first matchExpressions in requiredDuringSchedulingIgnoredDuringExecution under nodeAffinity in enabledAtroposEbs affinity


### Release 1.0.98
- Bugfix: Bugfixes for changes added in release 1.0.97

### Release 1.0.97
- Improvement: Added the tolerations and affinity required for atropos-ebs adoption

### Release 1.0.96
- Improvememnt: Increase the default retry count for deployment hooks from 0 to 5 
- Improvement: Add support for service account name in deployment hooks

### Release 1.0.95
- Improvement: Provided input option to override atropos-ebs-init-container's image, resources
- Improvement: Hardened the security for the atropos-ebs-init-container
- Bugfix: Bugfixes for changes added in release 1.0.92

### Release 1.0.92
- Feat: Support for Additional Annotations

### Release 1.0.91
- Improvement: Changed the atropos-ebs-init-container's image with a signed image
- Improvement: Hardened the security for the atropos-ebs-init-container
- Added new Olympus label

### Release 1.0.88
- Feat: Add AtropoSchedule CR template

### Release 1.0.87
- Feat: Support to Add annotations to Deployment Object.

### Release 1.0.84
- Feat: Support to Disable Topology Aware Hints/routing

### Release 1.0.83
- Bug Fix: Spell fix in atropos initContainer security context (Do not use Release 1.0.83 at the moment)

### Release 1.0.82
- Bug Fix: Fixing atropos initContainer security context to make it runAsRoot (Do not use Release 1.0.82 at the moment)

### Release 1.0.81
- Bug Fix: Templating fix for checking condition for enabling EBS volume dynamic path creation to all the services using Atropos.(Do not use Release 1.0.81 at the moment)

### Release 1.0.80
- Feat: Enabling EBS volume dynamic path creation to all the services using Atropos.(Do not use Release 1.0.80 at the moment)

### Release 1.0.79
- Feat: Templating addition for Network Policy and AWS Targetgroup Binding

### Release 1.0.78
- Bug Fix: Topologyspread Constraints - add enabled in if condition

### Release 1.0.77
- Feat: Update HPA apiVersion from autoscaling/v2beta2 to apiVersion: autoscaling/v2
- Feat: Added CronJob tpl to allow users to use Cronjob from common-chart only.

### Release 1.0.76
- Feat: Exposing common-chart's version used by the deployment of application

### Release 1.0.75
- Feat: Support addition for loadbalancer type service

### Release 1.0.74
- Bug Fix: Service-monitor-v2: Fix missing delimiter issue in case of multiple custom service monitors.

### Release 1.0.71
- Feat: Templating addition for Atropos Subscription And Topic

### Release 1.0.70
- bugFix: Templating fix in rollout template for canary strategy

### Release 1.0.69
- Feat: Add support for application log level change (both root and logger specific) at runtime.

### Release 1.0.68

- Feat: Add support for pod topology constraints.
- Feat: Add support for topology aware hints. But this will be available after 1.24 EKS Upgrade. 

### Release 1.0.67

- Feat: Add "alpha" feature for pod topology constraints. This will be changed in the future. Please use on your own risk.

### Release 1.0.66

- Feat: Vault Annotations
  - Enable TLS Verify for Vault Communication 
  - Remove duplicate annotations for vault that are set by default by vault-secrets-webhook

### Release 1.0.65

- Bug Fix: Argo Rollouts: fix enable key for rollout.strategy.canary.analysis.enabled

### Release 1.0.63

- Bug Fix: istio: fix templating error in usage of "*" in isito.serviceExportTo

### Release 1.0.62

- add flag to enable service of type NodePort
  Enable service type NodePort using flag isNodePort: true under service key

### Release 1.0.61

- add probe template for defining health checks
  using [Prometheus Probe](https://github.com/prometheus/blackbox_exporter)
- Deprecate: httpHealthCheckServiceMonitor in favour of probe

### Release 1.0.60

- enable jmxmetrics service monitor by default
- 44444 port has been added as default for jmx metrics, users using this version of chart should remove jmx metrics port
  44444 from extra ports list

### Release 1.0.59

- Feature: Option to set failure threshold for liveness and readiness probes

### Release 1.0.58

- bug fix on servicemonitor-v2.tpl

### Release 1.0.57[BREAKING]

- enable springbootHttpScrapeConfig and omsHttpScrapeConfig by default using key disabled: false

### Release 1.0.55

- fix env template for deployment - remove duplicate rendering of deployment - env

### Release 1.0.52

- serviceMonitor: typo fixes

### Release 1.0.51

- serviceMonitor: provide support for service monitors for oms and springboot apps

### Release 1.0.49

- serviceAccount: allow adding annotations to serviceAccount

### Release 1.0.48

- security update: add `seccompProfile: RuntimeDefault` to security
  context. [REF](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-seccomp-profile-for-a-container)
- security update: add container level security context for allowPrivilegeEscalation, privileged, capabilities

### Release 1.0.47

- Re-releasing common chart due to its accidental deletion due to chartmuseum inc.

### Release 1.0.46

- deployment: oms: allow enabling of sidecars

### Release 1.0.45

- rename http-jolokia port to jolokia for OMS & Spring Boot Apps.

### Release 1.0.44

- add DEPLOYMENT_NAME and SERVICE_NAME environment variables for all OMS and spring boot apps

### Release 1.0.43

- add support for mounting /dumps for emptyDir type Volume for oms and springboot apps.
- add support for adding env vars JAVA_RMI_SERVER_HOSTNAME, JOLOKIA_JAVAAGENT_LISTEN_HOST, and jolokia port 8778 by
  default for oms and spring boot apps
- fix typo on jolokia port name

### Release 1.0.42

- add support for mounting /dumps for emptyDir type Volume for oms and springboot apps.
- add support for adding env vars JAVA_RMI_SERVER_HOSTNAME, JOLOKIA_JAVAAGENT_LISTEN_HOST, and jolokia port 8778 by
  default for oms and spring boot apps, users using this version of chart should remove jolokia port 8778 from extra
  ports list

### Release 1.0.39

- add support for exporting metrics for oms apps.
    - creates env variable required to set appropriate port
    - exposes port in pod spec
    - creates entry in `service` object
    - enable servicemonitor by using `omsHttpScrapeConfig.enabled: true`

### Release 1.0.38

- Added NODE_NAME and CONTAINER_NAME env variables for all OMS and SpringBoot apps

### Release 1.0.37

- Bug Fix: Do not set "replicas" when using
  HPA. [REF](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/#leaving-room-for-imperativeness)

### Release 1.0.36

- Feature: Adding regex support in http-content kuberhealthy check.

### Release 1.0.35

- Feature: Option to set liveness and readiness probes timeout seconds

### Release 1.0.33

- BugFix: Fixing helm lint issue for watch templates, helm template command was working but helm lint was throwing error
- Fixing default values in slo templates and adding Label support in slo template

### Release 1.0.32

- Feat: Update HPA apiVersion from autoscaling/v2beta1 to apiVersion: autoscaling/v2beta2

### Realease 1.0.31

- Feature: Generalised the url in _watch_synthetic_monitor template.
- Updated timeout to 2 minutes in _watch_kuberhealthy-checks template for every checks.

### Release 1.0.29

- Feature: Added "common.slo_for_ingress" template for defining slo's for ingress endpoints
- Feature: Added "common.httpHeadersKhcheck" template for synthetic checks with header support
- Feature: Added requestType and requestBody support in "common.httpKhcheck" template
- Added support for above two monitors feature in "common.synthetic_monitor" template
- Modified some default values for slo templates

### Release 1.0.28

- Istio sidecar injection disabled for _watch_kuberhealthy-checks template

### Release 1.0.27

- bugfix: changing default value to true for runAsNonRoot in security context

### Release 1.0.26

- bugfix: default function treats boolean false and int 0 as not defined, and applies default, so current
  common.security-context always applies default values as true for runAsNonRoot and runAsUser, runAsGroup cannot be
  overriden to 0. Fix has been added for same

### Release 1.0.25

- Feature: SLO Template
- Feature: Synthetic Monitor template (Enables monitors, alerts, slo for kuberhealthy checks)
- Shifted http,oms,sftp khchecks definition under a new file _kuberhealthy-checks

---

### Release 1.0.24

- Adding explicit resources for logrotation sidecar to optimize the resource utilization percentage

### Release 1.0.23

- Feature: Canary Deployment.
- Feature: Enabling istio properly for services.

---

### Release 1.0.22

- Disable templating in envProperties and volumeMounts by default. Can be enabled by "useGoTemplate: true".
- bugfix: disable templating of envs in deployment-springboot if envs is not specified

---

### Release 1.0.19

- Set the OTEL_SERVICE_NAME environment variable

---

### Release 1.0.17

Major Changes:

- Some **new defaults** have been set using values.yaml
- add CONTRIBUTE.md
- add CHANGELOG.md (move changelog from README.md to current file)
- create README.md using helm-docs

add more documentation to values.yaml
---

### Release 1.0.16

- feature: allow templating in envProperties and volumeMounts Example: BASE_URL:
  api.{{.Values.global.olympusLabels.olympusZoneEnv}}.zetaapps.in

---

### Release 1.0.15

- feature: allow adding HTTP Headers to livenessProbe and readinessProbe using `service.probeHttpHeaders`
- feature: allow adding annotations to service using `service.annotations`
- feature: allow making a service headless by using `service.isHeadless`

---

### Release 1.0.14

- fix dangling else clause in Release 1.0.13

---

### Release 1.0.13

- if global variable is not defined in values file we get nil pointer exception at global.olympusLabels. So, a fix has
  been added for the same in _helpers.tpl

---

### Release 1.0.9

- Add option to specify revisionHistoryLimit in deployment spec

---

### Release 1.0.9

- add new labels in common.labels

---

### Release 1.0.8

- Fix ingress schema change problems in Release 1.0.6

---

### Release 1.0.7 (Buggy due to 1.0.6 )

- Bugfix: cluster should be able to override the default zone injected properties

---

### Release 1.0.6 (Buggy)

- Update Ingress API Version to v1
- Add option to specify olympusLabels as global variable

---

### Release 1.0.4

- Add support to disable heracles route spec from parent charts.
- **Change required**: if you are using heraclesRouteSpec. You will need to add "enabled: true" in it.

---

### Release 1.0.2

Bug fix
```terminationGracePeriodSeconds``` is a pod spec not a deployment spec. This change is backward compatible. No change
required.

---

### Release 0.4.22

* Add support for controlling deployment strategies.
* Enable option for pods to have more time for graceful shutdown.

```
# controlled deployments
deploymentStrategy:
  enabled: true
  strategy:
    type: rollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
# graceful shutdown
containerLifecycleControl:
  enabled: false
  terminationGracePeriodSeconds: 30
```

---

### Release 0.4.19

* Add support for controlling the imageTag of logrotation container from values file
* Check the latest commits on logrotate sidecar:
    - https://bitbucket.org/zetaengg/logrotate/commits/

```
logrotation:
  logDirectory: /logs/<application_name>
  logMaxSize: 100M
  maxCountRotated: 5
  imageTag: v0.0.2
extraVolumeMounts:
- name: log-directory
  mountPath: /logs/<application_name>
extraVolumes:
- name: log-directory
  emptyDir: {}
```

---
## Old Releases
---

### Release 0.2.9 [Deprecated]

* Added service monitor
* To enable service monitor

- Create servicemonitor.yaml file and add following content

```gotemplate
  {{- template "common.servicemonitor" . }}
```

- set .Values.serviceMonitor.enable to true
-

```yaml
        serviceMonitor:
          enable: true
```

* Configurable params in values file with default values

```gotemplate
    serviceMonitor:
    enabled: true
    namespace: {{ .Release.Namespace }}
    labels:
    path: /
    port:
    scrapeTimeout: 10s
    interval: 60s
    matchLabels: {{- include "common.labels" . | nindent 6 }}
    matchNamespace: {{ .Release.Namespace }}
```

Note: port is a mandatory param, code will break if service monitor is enabled and port is not specified

---

### Release 0.3.0

* Added pod disruption budget to common.deployment-springboot and common.deployment-oms
* It is enabled by default if replicas > 1
* By default minAvailable is 50%, you can however override it by specifying the block below

```yaml
podDisruptionBudget:
  minAvailable: "75%"
```

---

### Release 0.3.2

* Added ingress-v2 support
    * This ensures that you won't have to specify host names anymore in the ingress
    * Gotchas
        * Ensure that you don't have hyphens in your cluster name (k8s namespace). If you do, use a clusterAlias as a
          stop gap but move to a non hyphenated name asap.
    * The uri will be rewritten to group 1 of the path regex
    * In the below example, any request to \<hostname\>/testService/xyz/\<blah\> will be sent
      to http://myservice:9090/xyz/\<blah\> (=> So nothing needs to change on the app or kubernetes service)

Sample config

```yaml
global:
  clusterAlias: testCluster
ingress:
  annotations:
    kubernetes.io/ingress.class: nginx
  hosts:
    - paths: [ "/testService(/xyz.*)" ]
  tls: { }
```

And the corresponding ingress generated

```yaml
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: sample-ingress
  namespace: test-cluster
  labels:
    app.kubernetes.io/name: sample-service
    helm.sh/chart: sample-service-0.1.19
    app.kubernetes.io/instance: some-name
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: $1
spec:
  rules:
    - http:
        paths:
          - path: /testCluster/testService(/xyz.*)
            backend:
              serviceName: myservice
                servicePort: 9090
```

---

### Release 0.3.3

** Added support to add extra pod labels and annotations **

- **Add Additional labels:**
  Sample:

```
    additionalPodLabels:
        "olympus.zone.env": "staging"
        "olympus.zone": "aws-default-staging-mumbai"
        "olympus.cluster": "zone-logging"
        "olympus.cluster.bu": "opsinfra"
        "olympus.cluster.team": "opsinfra"
```

- **Add Additional annotations:**
  Sample:

```
    additionalPodAnnotations:
        "health.check.helios.enable": "true"
        "health.check.helios.url": "helios.internal.mum1-stage.zeta.in"
        "health.check.module": "http_helios_2xx"
```

---

### Release 0.3.4

* Added multiple service monitor
* To enable service monitor<br>
    - Create servicemonitor.yaml file and add following content

```
        {{- template "common.servicemonitor-v2" . }}
```

    - set .Values.serviceMonitor.enable to true and add service monitors array in .Values.serviceMonitor.monitors

```
        serviceMonitor:
         enable: true
         monitors:
            - name: monitor1
              ....
            - name: monitor2
```

* Configurable params in values file with default values

```
    serviceMonitor:
      enabled: true
      monitors:
        - name: monitor1
          namespace: {{ .Release.Namespace }}
          labels:
          path: /
          port: port1
          scrapeTimeout: 10s
          interval: 60s
          matchLabels: {{- include "common.labels" . | nindent 6 }}
          matchNamespace: {{ .Release.Namespace }}
        - name: monitor2
          namespace: {{ .Release.Namespace }}
          labels:
          path: /
          port: port2
          scrapeTimeout: 10s
          interval: 60s
          matchLabels: {{- include "common.labels" . | nindent 6 }}
          matchNamespace: {{ .Release.Namespace }}
```

**Note:** port is a mandatory param, code will break if service monitor is enabled and port is not specified

---

### Release 0.3.7

* PodDisruptionBudget Bug fix

---

### Release 0.3.8

* PodDisruptionBudget Bug fix for variable scope in annotations

---

### Release 0.4.0

* Added support for loading prometheus rules files as config
* To enable set `.Values.rule.loadAsConfig` value to true

```
rule:
  loadAsConfig: true
```

---

### Release 0.4.1

#### Added support to add additional labels in following resources

| Resource kind | Affected Templates | Setting Labels using Values file |
| ------ | ------ | ------- |
| Deployment | _deployment-oms.tpl, _deployment-springboot.tpl |  .Values.deployment.additionalLabels |
| Ingress | _ingress.tpl, _ingress-v2.tpl |  .Values.ingress.additionalLabels |
| Service | _postgresql-service.tpl, _service.tpl |  .Values.service.additionalLabels |
| Secret | _secret.tpl |  .Values.secret.additionalLabels |
| ServiceAccount | _service-account.tpl |  .Values.serviceAccount.additionalLabels |
| ConfigMap | _volume-mount-configmap.tpl |  .Values.volumeMounts[index]additionalLabels |

#### Added support to add olympus labels labels in following resources

Olympus labels are used get cluster, bu, team, env and zone information for the resource These labels can be used for
different requirement. For instance these will be used in the assignment of alert to appropriate team.

#### Enabling olympus labels

By deafult these labels are disables. Once enabled these will be added to all the resources. Set following values in the
values file to enable olympus labels

```
olympusLabels:
  olympusCluster: clusterName
  olympusClusterBU: buName
  olympusClusterTeam: teamName
  olympusZone: zoneName
  olympusZoneEnv: env
```

| Resource kind | Affected Templates |
| ------ | ------ |
| Deployment | _deployment-oms.tpl, _deployment-springboot.tpl |
| Pod | _deployment-oms.tpl, _deployment-springboot.tpl |
| Ingress | _ingress.tpl, _ingress-v2.tpl |
| Service | _postgresql-service.tpl, _service.tpl |
| Secret | _secret.tpl |
| ServiceAccount | _service-account.tpl |
| ConfigMap | _volume-mount-configmap.tpl, _configmap.tpl,  _env-configmap.tpl |
| PrometheusRule | _prometheus-rule.tpl |
|ServiceMonitor | _servicemonitor.tpl, _servicemonitor-v2.tpl |

---

### Release 0.4.7

* Added http health check support
* To enable http health check support<br>
    - Create http-health-check-servicemonitor.yaml file and add following content

```
        {{- template "common.http-health-check-servicemonitor" . }}
```

    - set .Values.httpHealthCheckServiceMonitor.enabled to true and add an array of targets in .Values.httpHealthCheckServiceMonitor.targets

```
        httpHealthCheckServiceMonitor:
          enabled: true
          targets:
            - name: google.com    # Human readable URL that will appear in Prometheus / AlertManager
              url: http://google.com           # The URL fow which health check should be configured
              labels: {}                       # List of labels for ServiceMonitor.
              interval: 120s                    # Scraping interval.
              scrapeTimeout: 5s               # Scrape timeout.
              module: http_2xx                 # Module used for scraping.
```

**Sample
Implementation:** [data-connector diff](https://bitbucket.org/zetaengg/ep-cluster/pull-requests/1273/sample-implementation-of-http-health-check)

---

### Release 0.4.9

* Add hpa support
* To enable hpa( Horizontal Pod Autoscaler)
    - Create hpa.yaml file and add following content

```
          {{- template "common.hpa" . }}
```

```
      - Add following values
          hpa:
            enabled: true
            maxReplicas: 4   # Maximum no of replicas
            cpu: 80          # targetAverageUtilization
            mem: 80          # targetAverageUtilization
```

---

### Release 0.4.10

* Add heracles route spec support
* To enable `Heracles Route Specification` in the application
* Create `heracles.yaml` file in your application app chart and add following content

```
    {{- template "common.heracles-route" . }}
```

* Add following in values.yaml (This is an example configuration)

```
heraclesRouteSpec:
  paths:
    - "/httpbin/(.*)"
    - "/test/(.*)"
  config:
    requestTransformer:
      httpbin-transformer:
        replace:
          uri: "/$(uri_captures[1])"
    rateLimiting:
      httpbin-rate-limiting:
        enabled: true
        minute: 2
        policy: local
        limit_by: header
        header_name: "User-Agent"
```

* Note: If not specified is, the default upstream-setting is:

```
  proxy-setting:
    protocol: http
    path: /
    connect_timeout: 60000
    retries: 3
    read_timeout: 60000
    write_timeout: 60000
  route-setting:
    methods: "POST,PUT,DELETE,PATCH,GET,OPTIONS"
    preserve_host: true
    strip_path: false
```

---

### Release 0.4.11

* Add support for priorityclass
* To enable priorityclass - Add following contents to chart values

```
          priorityClassName: <className>
```

---

### Release 0.4.12

* Add support for subPath in volumeMounts
* To enable subPath - Add following contents to chart values

```
          subPath: <subPath>
```

---

### Release 0.4.17

* Add support for log rotation with sidecar container
* To enable logrotation of logs within the app container
    - Add following content to chart values:

```
  logrotation:
    enabled: true
    logDirectory: /logs/<application_name>
    logMaxSize: 100M
    maxCountRotated: 5
  extraVolumeMounts:
    - name: log-directory
      mountPath: /logs/<application_name>
  extraVolumes:
    - name: log-directory
      emptyDir: {}
```

---

### Release 0.4.18

* Fix issue with service-monitor-v2 (for helm v3.5.1 compatibility)

---

### Release 1.0.56

* Add support for imagePullSecrets and added default value for the secret

### Release 1.0.64

* Removed deprecated APIs from PDB.

#### Release 1.0.103
added helm templates for zone-traffic 
