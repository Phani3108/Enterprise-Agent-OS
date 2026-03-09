# common

![Version: 1.0.95](https://img.shields.io/badge/Version-1.0.95-informational?style=flat-square)

Common chartbuilding components and helpers for zeta

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| additionalPodAnnotations | object | `{}` | Annotations for the pods |
| additionalPodLabels | object | `{}` | Labels for the pods |
| affinity | object | `{}` | [Assign custom affinity rules to the deployment](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/) |
| containerLifecycleControl.enabled | bool | `true` | enables terminationGracePeriodSeconds |
| containerLifecycleControl.terminationGracePeriodSeconds | int | `30` | Allow application to gracefully disconnect from clients by waiting x before terminating pods |
| cronJob.enabled | bool | `false` |  |
| cronJob.restartPolicy | string | `"OnFailure"` |  |
| cronJob.schedule | string | `"0 0 * * *"` |  |
| cronJob.spec.containers[0].command[0] | string | `"/bin/bash"` |  |
| cronJob.spec.containers[0].command[1] | string | `"script.sh"` |  |
| cronJob.spec.containers[0].image | string | `"813361731051.dkr.ecr.ap-south-1.amazonaws.com/dockerhub:nginx_non_root_v5"` |  |
| cronJob.spec.containers[0].name | string | `"nginx"` |  |
| deploymentStrategy.enabled | bool | `false` | enables manual specification the Deployment `strategy` |
| deploymentStrategy.strategy.rollingUpdate | object | `{"maxSurge":"25%","maxUnavailable":"25%"}` | if `strategy.type` is `RollingUpdate`, specify rolling update configs |
| deploymentStrategy.strategy.rollingUpdate.maxSurge | string | `"25%"` | [max surge](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#max-surge) |
| deploymentStrategy.strategy.rollingUpdate.maxUnavailable | string | `"25%"` | [max-unavailable](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#max-unavailable) |
| deploymentStrategy.strategy.type | string | `"RollingUpdate"` | strategy.type to be used. "Recreate", "RollingUpdate' |
| enableAtroposEbs | object | `{"inDeployment":false,"initContainer":{"image":"813361731051.dkr.ecr.ap-south-1.amazonaws.com/permission-changer:1.0.0","resources":{}}}` | Enable write access to EBS attached to the node for applications (required for applications using Atropos) |
| enableAtroposEbs.inDeployment | bool | `false` | To enable this, add this whole block to your application helm chart value.yaml and change inDeployment to true. |
| envProperties | object | `{}` | environment variables for the deployment using configMapRef from `{{ .Chart.Name }}-env-configmap`. Supports gotemplate. |
| envs | list | `[]` | environment variables for the deployment |
| fullnameOverride | string | `""` | String to fully override "common.fullname" |
| heraclesRouteSpec.config | object | `{}` | config for RouteSpec [Details](https://heraclesdocs0zetaapps.internal.olympus-world.zeta.in/docs/getting-started/heracles-route-spec/) |
| heraclesRouteSpec.enabled | bool | `false` | enable creation of `HeraclesRouteSpecification` for this service |
| heraclesRouteSpec.paths | list | `["/"]` | paths for the this route |
| heraclesRouteSpec.portOverride | string | `nil` | use a port other than `service.port` |
| hpa.additionalMetrics | list | `[{"containerResource":{"container":"application","name":"cpu","target":{"averageUtilization":60,"type":"Utilization"}},"type":"ContainerResource"}]` | Custom metrics or additional metrics to be added in spec.metrics section of HPA |
| hpa.additionalMetrics[0] | object | `{"containerResource":{"container":"application","name":"cpu","target":{"averageUtilization":60,"type":"Utilization"}},"type":"ContainerResource"}` | an example of adding metric of ContainerResource type |
| hpa.behavior | object | `{"scaleDown":{"policies":[{"periodSeconds":15,"type":"Percent","value":100}],"stabilizationWindowSeconds":300},"scaleUp":{"policies":[{"periodSeconds":15,"type":"Percent","value":100},{"periodSeconds":15,"type":"Pods","value":4}],"selectPolicy":"Max","stabilizationWindowSeconds":0}}` | override the default behavior of HPA |
| hpa.cpu | int | `80` | Average CPU utilization percentage for the pods |
| hpa.enabled | bool | `true` | Enable HPA |
| hpa.maxReplicas | int | `4` | Maximum number of replicas for the HPA. We get the minimum from `replicaCount` |
| hpa.mem | bool | `false` | Average memory utilization percentage for the pods |
| httpHealthCheckServiceMonitor.enabled | bool | `false` | Enable a prometheus http health check service monitor |
| httpHealthCheckServiceMonitor.targets[0].interval | string | "120s" | Interval at which url should be probed |
| httpHealthCheckServiceMonitor.targets[0].labels | object | `{}` | List of labels for ServiceMonitor. |
| httpHealthCheckServiceMonitor.targets[0].module | string | `"http_2xx"` |  |
| httpHealthCheckServiceMonitor.targets[0].name | string | `"service-monitor-name"` |  |
| httpHealthCheckServiceMonitor.targets[0].scrapeTimeout | string | "5s" | Timeout after which the scrape is ended |
| httpHealthCheckServiceMonitor.targets[0].url | string | `""` | The URL fow which health check should be configured. Example: http://google.com |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy applied to the deployment. |
| image.repository | string | `"813361731051.dkr.ecr.ap-south-1.amazonaws.com"` | OCI Repository Base URL. |
| image.repositoryPath | string | `""` | Image Name |
| image.tag | string | .Chart.AppVersion | Image Tag |
| imagePullSecrets.enabled | bool | `false` |  |
| imagePullSecrets.name | string | `"jfrog-secret"` |  |
| ingress.annotations | object | `{"kubernetes.io/ingress.class":"nginx"}` | annotations for ingress |
| ingress.hosts[0].host | string | `"proteus.example.com"` |  |
| ingress.hosts[0].paths[0] | string | `"/"` |  |
| ingress.tls | list | `[]` |  |
| istio.destinationRule.additionalSpec | string | `nil` | append this ".spec" section of DestinationRule |
| istio.destinationRule.enabled | bool | `true` | to create custom DestinationRule for this service. (Required for canary deployment with trafficRouting) |
| istio.destinationRule.override | bool | `false` | override ".spec" section of DestinationRule completely. |
| istio.enabled | bool | `true` | to enable creation of Virtual Service and Destination Rule and other annotations in Service (Required for canary deployment with trafficRouting) |
| istio.hosts | list | `[]` | hostnames using which the service can be referred to. these hostnames can only be interpreted by envoy sidecar in the namespaces specified in serviceExportTo |
| istio.injectSidecar | bool | `true` | to enable sidecar injection (it's enabled in lack of this flag) |
| istio.serviceExportTo | list | `[]` | namespaces where we will export istio objects to besides the current namespace. put "zone-traffic" here if your service is accessed via ingress. |
| istio.virtualService.additionalSpec | string | `nil` | append this ".spec" section of VirtualService |
| istio.virtualService.enabled | bool | `true` | to create custom VirtualSerivce for this service. (Required for canary deployment with trafficRouting) |
| istio.virtualService.override | bool | `false` | override ".spec" section of VirtualService completely. |
| jmxScrapeConfig | object | `{"disabled":false,"interval":"60s","path":"/","scrapeTimeout":"10s"}` | Enable jmx metrics service monitor (required for all application) |
| jmxScrapeConfig.disabled | bool | `false` | enable scraping of jmx metrics |
| jmxScrapeConfig.interval | string | `"60s"` | interval for jmx prometheus scraping |
| jmxScrapeConfig.path | string | `"/"` | Path for jmx prometheus scraping |
| jmxScrapeConfig.scrapeTimeout | string | `"10s"` | Timeout for jmx prometheus scraping |
| log4Olympus | object | `{"config":{"log4olympus_olympus.common.executors.MonitoredTask":"ERROR","log4olympus_root":"INFO"},"dynamicConfigDisabled":false,"mountPath":"/app/dynamicL4O2Config"}` | specify log4Olympus configurations. Note that defaults are already in place for these properties and these should be modified only if required. |
| log4Olympus.config | object | `{"log4olympus_olympus.common.executors.MonitoredTask":"ERROR","log4olympus_root":"INFO"}` | Map of logger name and desired log level (in caps). By default, "log4olympus" (also configurable) is used a prefix for specifying logger names. The logger name "root" (also configurable) is used to denote the root log level of the app. |
| log4Olympus.dynamicConfigDisabled | bool | `false` | Disable the entire feature of dynamic log level control by setting this value to "true". By default this feature will be enabled. Rest of the attributes here have no relevance if this attribute is set to "true" |
| log4Olympus.mountPath | string | `"/app/dynamicL4O2Config"` | The path inside the pod at which log4olympus config map will be mounted to. The default value is "/app/dynamicL4O2Config" |
| logrotation.enabled | bool | `false` | enables logrotation sidecar for the deployment |
| logrotation.imageTag | string | `"v0.0.3"` | image tag to be used for logrotate image |
| logrotation.logDirectory | string | /logs/"common.fullname" | directory path inside your container where you want to rotate logs |
| logrotation.logMaxSize | string | `"100M"` | max size that single log file OR log file size that triggers log rotation |
| logrotation.maxCountRotated | int | `5` | maximum number of logs file to keep |
| nameOverride | string | `""` | Provide a name in place of .Chart.Name |
| nodeSelector | object | `{}` | [NodeSelector](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/) |
| olympusLabels.olympusCluster | string | `"cluster-name"` | cluster name. global can override. Example: "Apollo" |
| olympusLabels.olympusClusterBU | string | `"bu-name"` | BU name. global can override. Example: "Commons" |
| olympusLabels.olympusClusterTeam | string | `"cluster-team"` | Team Name. global can override. Example: `Compute-Infra` |
| olympusLabels.olympusZone | string | `"zone-name"` | Zone Name. global can override. Example: `aws-common-prod-mumbai` |
| olympusLabels.olympusZoneEnv | string | `"zone-env"` | Zone Environment. global can override. Example: `production` |
| omsAppName | string | `""` | Name of OMS service name (required for OMS application only) |
| omsHttpScrapeConfig | object | `{"disabled":false,"interval":"60s","path":"/_metrics/","scrapeTimeout":"10s"}` | Enable oms metrics service monitor (required for oms application only) |
| omsHttpScrapeConfig.disabled | bool | `false` | enable scraping of oms prometheus based metrics |
| omsHttpScrapeConfig.interval | string | `"60s"` | interval for oms prometheus scraping |
| omsHttpScrapeConfig.path | string | `"/_metrics/"` | Path for oms prometheus scraping |
| omsHttpScrapeConfig.scrapeTimeout | string | `"10s"` | Timeout for oms prometheus scraping |
| postgres.hostname | string | `"psql-hostname"` | This should be required when internal is false so service-postgresql service can be configured to connect to this hostname |
| postgres.internal | bool | `false` | Internal being true will create service-postgresql service to connect to postgresql service directly. |
| priorityClassName | string | `nil` | specify priorityClassName for the pods in the deployment |
| probe.enabled | bool | `false` | Enable/Disable the prometheus probe feature |
| probe.targets[0].enabled | bool | `false` | to disable/enable this particular probe |
| probe.targets[0].interval | string | "120s" | Interval at which url should be probed |
| probe.targets[0].labels | object | `{}` | Dictionary of labels for Probe CR |
| probe.targets[0].mertriclabels | object | `{}` | Dictionary of labels for adding in the metrics |
| probe.targets[0].module | string | `"http_2xx"` |  |
| probe.targets[0].name | string | `"probe-name"` |  |
| probe.targets[0].scrapeTimeout | string | "5s" | Timeout after which the scrape is ended |
| probe.targets[0].urls | list | `["https://zeta.tech"]` | List of URLs fow which health check should be configured. |
| replicaCount | int | `3` | Number of instances of the application |
| resources | object | injected by namespace's default requests/limits specification | specify resources for the deployment. Otherwise, default namespace requests and limits will be applied |
| revisionHistoryLimit | int | `3` | Specify how many old replicaSets of deployment to retain. |
| rollout.additionalSpec | string | `nil` | append this to ".spec" section of Rollout |
| rollout.enabled | bool | `true` | enable argo rollout for a deployment. |
| rollout.override | bool | `false` | override ".spec" section of Rollout completely. |
| rollout.rollingUpdate | bool | `false` | do a rolling update of the deployment rather than a canary or blue-green rollout |
| rollout.strategy.canary.additionalSpec | string | `nil` | append this to ".spec.strategy.canary" section of Rollout |
| rollout.strategy.canary.analysis.additionalSpec | string | `nil` | add this to ".spec.strategy.canary.analysis" section of Rollout |
| rollout.strategy.canary.analysis.enabled | bool | `true` | enable automated analysis of rollout. If you are not using istio or using OMS Applications(with TCP), please disable this or override this with your own. |
| rollout.strategy.canary.analysis.maximumTries | only with istio | `10` | number of time s to retry the analysis, before aborting the rollout |
| rollout.strategy.canary.analysis.minimumRequests | only with istio | `100` | this is the minimum number of requests canary pods must receive to promote the canary deployment |
| rollout.strategy.canary.analysis.override | bool | `false` | override ".spec.strategy.canary.analysis" section of Rollout completely |
| rollout.strategy.canary.analysis.successThreshold | only with istio | `0.95` | this fractions of traffic comming to the canary pods must have 2xx response to promote the canary deployment |
| rollout.strategy.canary.enabled | bool | `true` | use [canary deployment](https://argoproj.github.io/argo-rollouts/features/canary/). |
| rollout.strategy.canary.override | bool | `false` | override ".spec.strategy.canary" section of Rollout completely |
| rollout.strategy.canary.steps.additionalSpec | string | `nil` | add this to ".spec.strategy.canary.steps" section of Rollout |
| rollout.strategy.canary.steps.enabled | bool | `true` | Disabling it, will change Canary to Rolling Update functionally |
| rollout.strategy.canary.steps.initialPause | string | `"10m"` | Wait for this much time before moving to any next steps |
| rollout.strategy.canary.steps.initialWeight | string | `"10m"` | First send this % traffic to the canary pods |
| rollout.strategy.canary.steps.override | bool | `false` |  |
| rollout.strategy.canary.trafficRouting.additionalSpec | string | `nil` | append this to ".spec.strategy.canary.trafficRouting" section of Rollout |
| rollout.strategy.canary.trafficRouting.enabled | bool | `true` | to enable [traffic splitting using istio](https://argoproj.github.io/argo-rollouts/features/traffic-management/istio/#subset-level-traffic-splitting). If disabled, cannary deployment will be done using the best effort percentage of pods of the application. Recommend by OMS Applications and Application without Isito. |
| rollout.strategy.canary.trafficRouting.override | bool | `false` | override ".spec.strategy.canary.trafficRouting" section of Rollout completely |
| service.annotations | object | `{}` | add annotations to your service |
| service.healthCheckPath | string | `"/status"` | Springboot only Define `path` used for liveliness and readiness probe. |
| service.isHeadless | bool | `false` |  |
| service.isLoadBalancer | bool | `false` |  |
| service.isNodePort | bool | `false` |  |
| service.livenessFailureThreshold | int | `3` | Springboot only. Failure Thershold for liveness probe (count) |
| service.livenessFrequency | int | `15` | Springboot only. one liveliness probe at each given second |
| service.livenessProbeInitialDelaySeconds | int | `10` | Springboot only. initialDelaySeconds for liveliness probe. in seconds. |
| service.omsHttpPort | int | `9099` | OMS only. HTTP listener |
| service.omsPort | int | `9091` | OMS only. Port at which OMS application is listening to. |
| service.port | int | `80` | Port at which k8s service will be listening at. |
| service.probeHttpHeaders | object | `{}` | Springboot only. add httpHeaders for livenessProbe and readinessProbe probes. |
| service.readinessFailureThreshold | int | `3` | Springboot only. Failure Thershold for readiness probe (count) |
| service.readinessFrequency | int | `30` | Springboot only. one readiness probe at each given second. |
| service.readinessProbeInitialDelaySeconds | int | `15` | Springboot only. initialDelaySeconds for readiness probe. in seconds. |
| service.targetPort | int | `80` | Springboot only. Port at which application (inside container) is listening to. |
| serviceAccountName | string | `""` | name of the service account created |
| serviceMonitor.enabled | bool | `false` | Enable a prometheus ServiceMonitor |
| serviceMonitor.monitors[0].interval | string | "60s" | Interval at which metrics should be scraped |
| serviceMonitor.monitors[0].labels | object | {} | labels attached to service monitor. `prometheus: zone-monitoring` is required. |
| serviceMonitor.monitors[0].matchLabels | object | '{ "common.labels" }' | used for `selector`. |
| serviceMonitor.monitors[0].matchNamespace | string | "{{ .Release.Namespace }}" | used for `namespaceSelector`. |
| serviceMonitor.monitors[0].name | string | `"jmx"` |  |
| serviceMonitor.monitors[0].path | string | "/" | HTTP path to scrape for metrics |
| serviceMonitor.monitors[0].port | string | `""` | "Name" of the service port for scraping metrics. Example: jmxmetrics |
| serviceMonitor.monitors[0].scrapeTimeout | string | "10s" | Timeout after which the scrape is ended |
| sidecar | object | `{}` | enables sidecar in OMS and Springboot deployment. We can add upto 2 sidecars using this |
| springbootHttpScrapeConfig | object | `{"disabled":false,"interval":"60s","path":"/prometheus","scrapeTimeout":"10s"}` | Enable springboot metrics service monitor (required for springboot application only) |
| springbootHttpScrapeConfig.disabled | bool | `false` | enable scraping of springboot prometheus based metrics |
| springbootHttpScrapeConfig.interval | string | `"60s"` | interval for springboot prometheus scraping |
| springbootHttpScrapeConfig.path | string | `"/prometheus"` | Path for springboot prometheus scraping |
| springbootHttpScrapeConfig.scrapeTimeout | string | `"10s"` | Timeout for springboot prometheus scraping |
| tolerations | list | `[]` | [Tolerations for use with node taints](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| topologyAwareHints | object | `{"disabled":false}` | [Disable topolologyAwareHints annotation to the Service](https://kubernetes.io/docs/concepts/services-networking/topology-aware-hints/) |
| topologySpreadConstraints | object | `{"additionalConfig":[],"azspread":{"enabled":false,"whenUnsatisfiable":"DoNotSchedule"},"enabled":false,"nodespread":{"enabled":false,"whenUnsatisfiable":"DoNotSchedule"}}` | [Assign custom Pod Topology Spread Constraints to the deployment](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
| topologySpreadConstraints.additionalConfig | list | `[]` | Any additional topologySpreadConstraints config can be added by using additionalConfig option as below. Note - labelSelector is added from the template. You don't have to define in the values file |
| topologySpreadConstraints.azspread | object | `{"enabled":false,"whenUnsatisfiable":"DoNotSchedule"}` | [If azspread is enabled pods will be distributed across different Availability Zones](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/#example-multiple-topologyspreadconstraints) |
| topologySpreadConstraints.azspread.enabled | bool | "false" | If set to true, pods will be distributed across availablity zones |
| topologySpreadConstraints.azspread.whenUnsatisfiable | string | "DoNotSchedule" | If you want to override the whenUnsatisfiable condition of topologySpreadConstraints you can modify "DoNotSchedule" |
| topologySpreadConstraints.enabled | bool | "false" | If set to true it enables topologySpreadConstraints |
| topologySpreadConstraints.nodespread | object | `{"enabled":false,"whenUnsatisfiable":"DoNotSchedule"}` | If nodespread is enabled, pods will be distributed across different Worker Nodes. Warning - You have to remove pod anti-affinity to spread pods across nodes when you enable nodespread(which does the same). It's recommended to use topologyspread instead of pod anti-affinity. See the Motivation section of topology spread document [User story](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/895-pod-topology-spread#user-stories) |
| topologySpreadConstraints.nodespread.enabled | bool | "false" | If set to it true pods will be distributed across different nodes |
| topologySpreadConstraints.nodespread.whenUnsatisfiable | string | "DoNotSchedule" | If you want to override the whenUnsatisfiable condition of topologySpreadConstraints you can modify "DoNotSchedule" |
| useGoTemplate | bool | `false` | all use of gotemplate in envProperties and volumeMounts |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.13.0](https://github.com/norwoodj/helm-docs/releases/v1.13.0)
