{{- define "common.deployment-oms" }}
{{- $omsAppEnvName := (print "EXTERNAL_VISIBLE_HOST_PORT_" (upper .Values.omsAppName) "_TCP_J") -}}
{{- $name := default .Chart.AppVersion .Values.image.tag -}}
{{- $tcpPort := default "9091" .Values.service.omsPort | toString -}}
{{- $omsAppHttpPort := default "9099" .Values.service.omsHttpPort | toString -}}
{{- $jolokiaPort := default "8778" .Values.service.jolokiaPort | toString -}}
{{- $jmxmetricsPort := default "44444" .Values.service.jmxmetricsPort | toString -}}
{{- $omsAppHttpPortEnvName := (print "EXTERNAL_VISIBLE_HTTP_PORT_" (upper .Values.omsAppName) )  -}}
{{- $redinessEnabled := default "true" .Values.service.readinessProbeEnabled }}
{{- $livenessEnabled := default "true" .Values.service.livenessProbeEnabled }}
{{- $commonChartVersion := "" -}}
{{- range .Chart.Dependencies }}
  {{- if eq .Name "common" }}
    {{- $commonChartVersion = .Version }}
  {{- end }}
{{- end }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ template "common.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- if ne $commonChartVersion "" }}
    app.kubernetes.io/common-chart: {{ $commonChartVersion }}
    {{- end }}
  {{- include "common.labels" . | nindent 4 }}
  {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if .Values.deployment }}
    {{- if .Values.deployment.additionalLabels }}
      {{- toYaml .Values.deployment.additionalLabels | nindent 4 }}
    {{- end }}
  {{- end }}
  {{- if (.Values.deployment).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.deployment.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  {{- if not (.Values.hpa).enabled }}
  replicas: {{ template "common.deployment-replicaCount" .}}
  {{- end }}
  {{- if .Values.revisionHistoryLimit }}
  revisionHistoryLimit: {{ .Values.revisionHistoryLimit }}
  {{- end }}
  {{- if .Values.deploymentStrategy }}
  {{- if eq .Values.deploymentStrategy.enabled true }}
  strategy:
  {{- toYaml .Values.deploymentStrategy.strategy | nindent 4 }}
  {{- end }}
  {{- end }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ include "common.name" . }}
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ include "common.name" . }}
        version: {{ $name | quote }}
        app.kubernetes.io/name: {{ include "common.name" . }}
        app.kubernetes.io/instance: {{ .Release.Name }}
        {{- if ne $commonChartVersion "" }}
        app.kubernetes.io/common-chart: {{ $commonChartVersion }}
        {{- end }}
        {{- include "common.olympus-labels" .Values | nindent 8 }}
        {{- if .Values.additionalPodLabels }}
          {{- toYaml .Values.additionalPodLabels | nindent 8 }}
        {{- end }}
      annotations:
        {{- include "common.vault-annotations" .Values | nindent 8 }}
        {{- with .Values.istio }}
        {{- /* Using "default" with boolean value is a pain https://github.com/helm/helm/issues/3308 */}}
        sidecar.istio.io/inject: {{ (hasKey . "injectSidecar" | ternary .injectSidecar true) | toString | quote }}
        {{- end }}
        {{- if .Values.additionalPodAnnotations }}
          {{- toYaml .Values.additionalPodAnnotations | nindent 8 }}
        {{- end }}
    spec:
{{- if ((.Values.imagePullSecrets).enabled) }}
      imagePullSecrets:
        - name: {{ default "jfrog-secret" .Values.imagePullSecrets.name }}
{{- end }}
{{- if .Values.containerLifecycleControl }}
{{- if .Values.containerLifecycleControl.enabled }}
      terminationGracePeriodSeconds: {{ .Values.containerLifecycleControl.terminationGracePeriodSeconds | default 60  }}
{{- end }}
{{- end }}
{{ include "common.security-context" . | indent 6 }}
{{- if .Values.hostAliases }}
      hostAliases:
{{ toYaml .Values.hostAliases | indent 8 }}
{{- end }}
      serviceAccountName: {{ .Values.serviceAccountName }}
{{- if .Values.priorityClassName }}
      priorityClassName: {{ .Values.priorityClassName | quote }}
{{- end }}
      initContainers:
{{- if ((.Values.enableAtroposEbs).inDeployment) }}
        - name: atropos-ebs-init-container
          {{- if (.Values.enableAtroposEbs.initContainer).image }}
          image: {{ .Values.enableAtroposEbs.initContainer.image }}
          {{- else }}
          image: 813361731051.dkr.ecr.ap-south-1.amazonaws.com/permission-changer:1.0.0
          {{- end }}
          command: ["/bin/sh", "-c"]
          args:
          - |
            output=$(df -hT | awk '$7 == "/atropos" {print $1,$2}');
            if [ "$output" != "/dev/nvme1n1 ext4" ]; then
              echo "Atropos EBS Volume not mounted on the Node, Failure";
              exit 1;
            fi;
            chmod o+w /atropos/
            echo "The Atropos EBS Volume is mounted";
          {{- if (.Values.enableAtroposEbs.initContainer).resources }}
          resources:
            {{- toYaml .Values.enableAtroposEbs.initContainer.resources | nindent 12 }}
          {{- else }}
          resources:
            requests:
              cpu: 10m
              memory: 32Mi
            limits:
              cpu: 20m
              memory: 64Mi
          {{- end }}
          volumeMounts:
          - mountPath: "/atropos"
            name: atropos-ebs-storage
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL
              add:
                - FOWNER
            privileged: false
            readOnlyRootFilesystem: true
            runAsUser: 1001
            runAsGroup: 2001
{{- end }}
      containers:
      {{- if .Values.logrotation }}
        - name: logrotation
          image: 813361731051.dkr.ecr.ap-south-1.amazonaws.com/logrotate:{{ .Values.logrotation.imageTag }}
          imagePullPolicy: IfNotPresent
          {{- include "common.security-context-container" . | nindent 10 }}
        {{- if .Values.logrotation.resources }}
          resources:
          {{- toYaml .Values.logrotation.resources | nindent 12 }}
        {{- else }}
          resources:
            requests:
              cpu: 0.15m
              memory: 8Mi
            limits:
              cpu: 3m
              memory: 40Mi
        {{- end }}
          env:
          - name: LOGROTATE_PATTERN
            value: "{{ default (printf "/logs/%s" (include "common.fullname" .)) .Values.logrotation.logDirectory | toString }}/*.log {{ default (printf "/logs/%s" (include "common.fullname" .)) .Values.logrotation.logDirectory | toString }}/*.current"
          - name: LOGROTATE_SIZE
            value: "{{ default "100M" .Values.logrotation.logMaxSize | toString }}"
          - name: LOGROTATE_ROTATE
            value: "{{ default "5" .Values.logrotation.maxCountRotated | toString }}"
          {{- if .Values.logrotation.extraEnvs }}
          {{- range $i, $extraEnv := .Values.logrotation.extraEnvs }}
          - name: {{ $extraEnv.name }}
            value: {{ $extraEnv.value }}
          {{- end }}
          {{- end }}
          volumeMounts:
          - name: log-directory
            mountPath: {{ default (printf "/logs/%s" (include "common.fullname" .)) .Values.logrotation.logDirectory }}
      {{- end }}
      {{- if .Values.sidecar }}
      {{- if  lt (len .Values.sidecar) 3 }}
      {{- toYaml .Values.sidecar | nindent 8 }}
      {{- end }}
      {{- end }}
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}/{{ .Values.image.repositoryPath }}:{{ $name }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          {{- include "common.security-context-container" . | nindent 10 }}
{{- if .Values.container }}
{{- if .Values.container.command }}
          command:
          - {{ .Values.container.command }}
{{- end }}
{{- if .Values.container.args }}
          args:
{{- range $key, $value := .Values.container.args }}
    {{- if $value }}
          - --{{ $key }}={{ $value }}
    {{- else }}
          - --{{ $key }}
    {{- end }}
{{- end }}

{{- end }}
{{- end }}
          env:
            - name: OTEL_SERVICE_NAME
              value: {{ include "common.name" . }}.{{ .Release.Namespace }}
              # NOTE: DEPLOYMENT_NAME, SERVICE_NAME, CONTAINER_NAME are the same as of today
              # Pick the values from K8s if the same does not hold true in the future
            - name: CONTAINER_NAME
              value: {{ .Chart.Name }}
            - name: DEPLOYMENT_NAME
              value: {{ template "common.fullname" . }}
            - name: SERVICE_NAME
              value: {{ template "common.fullname" . }}
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: JAVA_RMI_SERVER_HOSTNAME
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
            - name: JOLOKIA_JAVAAGENT_LISTEN_HOST
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
{{ toYaml ( append (append .Values.envs (dict "name" $omsAppEnvName "value"  $tcpPort ) ) (dict  "name" $omsAppHttpPortEnvName "value" $omsAppHttpPort) )  | indent 12}}
          ports:
            - name: tcp-j
              containerPort: {{ $tcpPort }}
              protocol: TCP
            {{- if .Values.omsAppName }}
            {{- if ne .Values.omsAppName "" }}
            - name: omshttp
              containerPort: {{ $omsAppHttpPort }}
              protocol: TCP
            {{- end }}
            {{- end }}
            - name: jolokia
              containerPort: {{ $jolokiaPort }}
              protocol: TCP
            - name: jmxmetrics
              containerPort: {{ $jmxmetricsPort }}
              protocol: TCP
{{- range $i, $port := .Values.extraPorts }}
            - name: {{ $port.name }}
              containerPort: {{ $port.targetPort }}
              protocol: {{ default "TCP" $port.protocol }}
{{- end }}
          envFrom:
{{- if not .Values.disablePropertiesConfigMap }}
          - configMapRef:
              name: {{ .Chart.Name }}-configmap
{{- end }}
          - configMapRef:
              name: olympus-cluster-properties-configmap
{{- if .Values.envProperties }}
          - configMapRef:
              name: {{ .Chart.Name }}-env-configmap
{{- end }}
          volumeMounts:
          - name: jvm-heap-dumps
            mountPath: /dumps
{{- if not (.Values.log4Olympus).dynamicConfigDisabled }}
          - name: log4olympus-volume
            mountPath: {{ (.Values.log4Olympus).mountPath | default "/app/dynamicL4O2Config" }}
{{- if ((.Values.enableAtroposEbs).inDeployment) }}
          - mountPath: "/atropos"
            name: atropos-ebs-storage
{{- end }}
{{- end }}
{{- if or .Values.volumeMounts .Values.extraVolumeMounts }}
{{- range $i, $volumeMount := .Values.volumeMounts }}
          - name: {{ $volumeMount.name }}
            mountPath: {{ $volumeMount.mountPath }}
            {{- if $volumeMount.subPath }}
            subPath: {{ $volumeMount.subPath }}
            {{- end }}
{{- end }}
{{- if .Values.extraVolumeMounts }}
{{ toYaml .Values.extraVolumeMounts | trim | indent 10 }}
{{- end }}
{{- end }}
        {{- if $livenessEnabled }}
          livenessProbe:
            tcpSocket:
              port: tcp-j
            initialDelaySeconds: {{ default 10 .Values.service.livenessProbeInitialDelaySeconds }}
            periodSeconds: {{ default 15 .Values.service.livenessFrequency }}
            successThreshold: 1
            failureThreshold: 3
        {{- end }}
        {{- if $redinessEnabled }}
          readinessProbe:
            tcpSocket:
              port: tcp-j
            initialDelaySeconds: {{ default 15 .Values.service.readinessProbeInitialDelaySeconds }}
            periodSeconds: {{ default 30 .Values.service.readinessFrequency }}
            successThreshold: 1
            failureThreshold: 3
        {{- end }}
          resources:
{{ toYaml .Values.resources | indent 12 }}
      volumes:
        - name: jvm-heap-dumps
          emptyDir: {}
{{- if not (.Values.log4Olympus).dynamicConfigDisabled }}
        - name: log4olympus-volume
          configMap:
            name: {{ include "common.name" . }}-log4olympus-configmap
            optional: true
{{- if ((.Values.enableAtroposEbs).inDeployment)}}
        - name: atropos-ebs-storage
          hostPath:
            path: /atropos/{{ .Release.Namespace }}/{{ .Chart.Name }}
            type: DirectoryOrCreate
{{- end }}
{{- end }}
{{- if or .Values.volumeMounts .Values.extraVolumes }}
{{- range $i, $volumeMount := .Values.volumeMounts }}
        - name: {{ $volumeMount.name }}
          configMap:
            name: {{ $.Chart.Name }}-{{ $volumeMount.configMapName }}-volume-mount-configmap
{{- end }}
{{- if .Values.extraVolumes }}
{{ toYaml .Values.extraVolumes | trim | indent 8 }}
{{- end }}
{{- end }}
    {{- with .Values.nodeSelector }}
      nodeSelector:
{{ toYaml . | indent 8 }}
    {{- end }}
{{- if ((.Values.enableAtroposEbs).inDeployment) }}
      affinity:
        {{- include "common.atropos-ebs-affinity" . }}
{{- else }}
    {{- with .Values.affinity }}
      affinity:
{{ toYaml . | indent 8 }}
    {{- end }}
{{- end }}
{{- if ((.Values.enableAtroposEbs).inDeployment) }}
      tolerations:
        {{- include "common.atropos-ebs-tolerations" . }}
{{- else }}
    {{- with .Values.tolerations }}
      tolerations:
{{ toYaml . | indent 8 }}
    {{- end }}
{{- end }}
{{- if (.Values.topologySpreadConstraints).enabled }}
  {{- if or .Values.topologySpreadConstraints.azspread .Values.topologySpreadConstraints.nodespread .Values.topologySpreadConstraints.additionalConfig }}
      topologySpreadConstraints:
     {{- if (.Values.topologySpreadConstraints.azspread).enabled }} 
{{ include "common.topology-spread.zone" . | indent 8 }}
     {{- end }}
     {{- if (.Values.topologySpreadConstraints.nodespread).enabled }}
{{ include "common.topology-spread.node" . | indent 8 }}
     {{- end }}
     {{- if (.Values.topologySpreadConstraints).additionalConfig }}
      {{- range .Values.topologySpreadConstraints.additionalConfig }}
      {{- $topologyLabel := fromYaml (include "common.topology-label" $) }}
      {{- $originalconfig := . }}
      {{- $topologyconfig := mergeOverwrite $originalconfig $topologyLabel }}
        - {{ toYaml $topologyconfig | indent 10 | trim }}
      {{- end }}
     {{- end }}
  {{- end }}
{{- end }}
---
{{ if gt .Values.replicaCount 1.0 }}
{{- template "common.pod-disruption-budget" (dict "global" $ "podDisruptionBudget" $.Values.podDisruptionBudget) -}}
{{- end }}
{{- end }}
