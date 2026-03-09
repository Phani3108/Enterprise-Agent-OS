{{- define "common.deployment-hooks" }}
{{- if $.Values.deploymentHooks }}
  {{- range $hook := $.Values.deploymentHooks }}
    {{- if (or (not (hasKey $hook "enabled")) $hook.enabled) }}
      {{- $hookName := (required "Hook name is required" $hook.name) }}
      {{- $hookPhase := $hook.phase | default "Sync" }}
      {{- $hookDeletePolicy := $hook.deletePolicy | default "HookSucceeded" }}
      {{- $hookPriority := $hook.priority | default 0 }}
      {{- $hookRetentionTime := $hook.hookRetentionTime | default 180 }}
      {{- $hookRetryLimit := $hook.retryLimit | default 5 }}
---
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ $hookName }}
  annotations:
    weave/sync-phase: {{ $hookPhase | quote }}
    weave/sync-hook-delete-policy: {{ $hookDeletePolicy | quote }}
    weave/sync-sequence: {{ $hookPriority | quote }}
spec:
  ttlSecondsAfterFinished: {{ $hookRetentionTime }}
  backoffLimit: {{ $hookRetryLimit }}
  template:
    metadata:
      annotations:
        {{- if hasKey $hook "vault" }}
        vault.security.banzaicloud.io/vault-addr:  {{ $hook.vault.addr | default "https://vault.zone-vault:8200" | quote }}
        vault.security.banzaicloud.io/vault-agent: {{ $hook.vault.agent | default "false" | quote }}
        vault.security.banzaicloud.io/vault-role: {{ $hook.vault.role | default "cluster-service" | quote }}
        vault.security.banzaicloud.io/vault-skip-verify: {{ $hook.vault.skipVerify | default "true" | quote }}
        {{- else }}
        vault.security.banzaicloud.io/vault-addr: "https://vault.zone-vault:8200" 
        vault.security.banzaicloud.io/vault-agent: "false" 
        vault.security.banzaicloud.io/vault-role: "cluster-service" 
        vault.security.banzaicloud.io/vault-skip-verify: "true" 
        {{- end }}
    spec:
      serviceAccountName: {{ $hook.serviceAccountName | default "default" | quote }}
      containers:
        - name: {{ $hookName }}
          image: {{ (required "Hook image is required" $hook.image) }}
        {{- with $hook.command }}
          command:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with $hook.env }}
          env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with $hook.envFrom }}
          envFrom:
          {{- toYaml . | nindent 10 }}
        {{- end }}
      restartPolicy: {{ $hook.restartPolicy | default "Never" | quote }}
      securityContext:
        runAsGroup: 2001
        runAsNonRoot: true
        runAsUser: 1001
---
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}