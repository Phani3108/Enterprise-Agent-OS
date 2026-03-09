{{- define "common.slo_for_ingress" -}}
{{- $rootValues := dict "Release" $.Release "Chart" $.Chart -}}
{{- /*
    -----------------------------------------------------SLO-----------------------------------------------------------------------  
*/ -}}
{{- range $i, $data := $.Values.slo_for_ingress -}}
{{- $sloValues := dict "enabled" true -}}

{{- /* Setting Default Values */ -}}
{{- $_ := set $sloValues "name" (printf "%s" $data.name) -}}
{{- $_ := set $sloValues "target" ("0.95" | quote) -}}
{{- $_ := set $sloValues "group" (printf "%s-ingress-slo-group" $.Release.Namespace) -}}
{{- $_ := set $sloValues "good"  (include "common.watch_slo_ingress_query_helper"  (merge (dict "queryType" "bad") $data)) -}}
{{- $_ := set $sloValues "total" (include "common.watch_slo_ingress_query_helper"  (merge (dict "queryType" "total") $data )) -}}
{{- $_ := set $sloValues "queryType"  $data.name -}}
{{- $_ := set $sloValues "labels" (dict "type" (ternary "latency" "availability" (hasKey $data "responseTime"))) -}}
{{- if $data.sloSpec -}}
{{- $sloValues = merge dict $data.sloSpec $sloValues -}}
{{- end -}}
{{- include "common.slo" (set $rootValues "Values" (dict "slo" $sloValues)) -}}
{{- end -}}

{{- end -}}

{{- /* 
    Helper function to create bad and total query for slo for ingress
*/ -}}
{{- define "common.watch_slo_ingress_query_helper" -}}
{{- $queryFilter := list -}}
{{- range $key, $val := .filter -}}
{{- $queryFilter = append $queryFilter (printf "%s=~%s" $key ($val| quote)) -}}
{{- end -}}

{{- $totalExpr := printf "sum(rate(ingress_requests_duration_seconds_count{%s}[$period]))" ($queryFilter | join ", ") -}}
{{- if eq .queryType "total" -}}
{{- $totalExpr -}}
{{- else -}}
{{- $responseTime := default 1 .responseTime -}}
{{- $goodIndicator := merge dict (default dict .goodIndicator) .filter (dict "response_code" "200") -}}
{{- $goodQueryFilter := list -}}
{{- range $key, $val := $goodIndicator -}}
{{- $goodQueryFilter = append $goodQueryFilter (printf "%s=~%s" $key ($val | quote)) -}}
{{- end -}}
{{- printf "sum(rate(ingress_requests_duration_seconds_bucket{%s, le=%s}[$period]))"  ($goodQueryFilter | join ", ") ($responseTime | quote) -}}
{{- end -}}
{{- end -}}

