!ifndef AIONUI_INSTALLER_OBSERVABILITY_NSH
!define AIONUI_INSTALLER_OBSERVABILITY_NSH

!define AIONUI_APP_EXECUTABLE_FILENAME "HiWork.exe"
!define AIONUI_FALLBACK_LOG "aionui-installer-${VERSION}-fallback-log.jsonl"

!pragma warning disable 6001
Var /GLOBAL HiWorkSessionId
Var /GLOBAL HiWorkIsUpdated
Var /GLOBAL HiWorkSessionLogResult
Var /GLOBAL HiWorkSessionLogPath

!macro AIONUI_SESSION_HEADER
  !insertmacro AIONUI_SLOG "event=header arch=${AIONUI_TARGET_ARCH} updated=$HiWorkIsUpdated instDir=$INSTDIR version=${VERSION} log=$HiWorkSessionLogPath detail=customHeader"
!macroend

!macro AIONUI_SLOG _MESSAGE
  Push $9
  nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "& { \
    $$ErrorActionPreference = 'SilentlyContinue'; \
    $$log = '$HiWorkSessionLogPath'; \
    if (-not $$log) { $$log = Join-Path $$env:TEMP '${AIONUI_FALLBACK_LOG}' }; \
    $$session = '$HiWorkSessionId'; \
    if (-not $$session) { $$session = 'uninitialized' }; \
    $$message = '${_MESSAGE}'; \
    $$event = 'log'; \
    if ($$message -match '(^|\s)event=([^\s]+)') { $$event = $$Matches[2] } else { $$first = @($$message -split '\s+', 2)[0]; if ($$first -and $$first -notmatch '=') { $$event = $$first } }; \
    $$payload = [ordered]@{ schemaVersion = 1; ts = (Get-Date -Format o); session = $$session; version = '${VERSION}'; arch = '${AIONUI_TARGET_ARCH}'; updated = ('$HiWorkIsUpdated' -eq '1'); instDir = '$INSTDIR'; event = $$event; message = $$message }; \
    $$json = $$payload | ConvertTo-Json -Compress -Depth 8; \
    Add-Content -LiteralPath $$log -Encoding UTF8 -Value $$json \
  }"`
  Pop $9
  Pop $9
!macroend

!macro AIONUI_LOG_EVENT _MESSAGE
  Push $9
  nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "& { \
    $$ErrorActionPreference = 'SilentlyContinue'; \
    $$log = '$HiWorkSessionLogPath'; \
    if (-not $$log) { $$log = Join-Path $$env:TEMP '${AIONUI_FALLBACK_LOG}' }; \
    $$session = '$HiWorkSessionId'; \
    if (-not $$session) { $$session = 'uninitialized' }; \
    $$message = '${_MESSAGE}'; \
    $$event = 'log'; \
    if ($$message -match '(^|\s)event=([^\s]+)') { $$event = $$Matches[2] } else { $$first = @($$message -split '\s+', 2)[0]; if ($$first -and $$first -notmatch '=') { $$event = $$first } }; \
    $$payload = [ordered]@{ schemaVersion = 1; ts = (Get-Date -Format o); session = $$session; version = '${VERSION}'; arch = '${AIONUI_TARGET_ARCH}'; updated = ('$HiWorkIsUpdated' -eq '1'); instDir = '$INSTDIR'; event = $$event; message = $$message }; \
    $$json = $$payload | ConvertTo-Json -Compress -Depth 8; \
    Add-Content -LiteralPath $$log -Encoding UTF8 -Value $$json \
  }"`
  Pop $9
  Pop $9
!macroend

!macro AIONUI_LOG_JSON_EVENT _EVENT _JSON_FIELDS
  Push $9
  nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "& { \
    $$ErrorActionPreference = 'SilentlyContinue'; \
    $$log = '$HiWorkSessionLogPath'; \
    if (-not $$log) { $$log = Join-Path $$env:TEMP '${AIONUI_FALLBACK_LOG}' }; \
    $$session = '$HiWorkSessionId'; \
    if (-not $$session) { $$session = 'uninitialized' }; \
    $$payload = [ordered]@{ schemaVersion = 1; ts = (Get-Date -Format o); session = $$session; version = '${VERSION}'; arch = '${AIONUI_TARGET_ARCH}'; updated = ('$HiWorkIsUpdated' -eq '1'); instDir = '$INSTDIR'; event = '${_EVENT}' }; \
    ${_JSON_FIELDS}; \
    $$json = $$payload | ConvertTo-Json -Compress -Depth 8; \
    Add-Content -LiteralPath $$log -Encoding UTF8 -Value $$json \
  }"`
  Pop $9
  Pop $9
!macroend

!macro AIONUI_SESSION_BEGIN
  ${GetParameters} $R9
  ClearErrors
  ${GetOptions} $R9 "--installer-log=" $R8
  ${IfNot} ${Errors}
    StrCpy $HiWorkSessionLogPath $R8
  ${EndIf}
  ClearErrors
  ${GetOptions} $R9 "--installer-session=" $R8
  ${IfNot} ${Errors}
    StrCpy $HiWorkSessionId $R8
  ${EndIf}

  ${If} $HiWorkSessionLogPath == ""
    nsExec::ExecToStack `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "$$id = '$HiWorkSessionId'; if (-not $$id) { $$id = [guid]::NewGuid().ToString('N').Substring(0,12) }; $$stamp = Get-Date -Format 'yyyyMMdd'; $$name = 'aionui-installer-${VERSION}-' + $$stamp + '-log.jsonl'; $$log = Join-Path $$env:TEMP $$name; [Console]::Out.Write($$id + '|' + $$log)"`
    Pop $HiWorkSessionLogResult
    Pop $HiWorkSessionLogResult
    StrCpy $HiWorkSessionId $HiWorkSessionLogResult 12
    StrCpy $HiWorkSessionLogPath $HiWorkSessionLogResult 1024 13
  ${ElseIf} $HiWorkSessionId == ""
    nsExec::ExecToStack `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "[Console]::Out.Write([guid]::NewGuid().ToString('N').Substring(0,12))"`
    Pop $HiWorkSessionLogResult
    Pop $HiWorkSessionLogResult
    StrCpy $HiWorkSessionId $HiWorkSessionLogResult
  ${EndIf}

  ClearErrors
  ${GetOptions} $R9 "--updated" $R8
  StrCpy $HiWorkIsUpdated "0"
  ${IfNot} ${Errors}
    StrCpy $HiWorkIsUpdated "1"
  ${EndIf}

  !insertmacro AIONUI_SLOG "event=session-begin detail=preInit"
!macroend

!macro AIONUI_LOG_EXTRACT_RESULT _METHOD
  ${IfNot} ${FileExists} "$INSTDIR\HiWork.exe"
    !insertmacro AIONUI_FAIL_UX \
      "${AIONUI_E_EXTRACT_FAILED}" \
      "event=extract result=fail method=${_METHOD} missing=HiWork.exe" \
      "${AIONUI_MSG_EXTRACT_FAILED_ZH}" \
      "${AIONUI_MSG_EXTRACT_FAILED_EN}" \
      "${AIONUI_MSG_EXTRACT_FAILED_ACTION_ZH}" \
      "${AIONUI_MSG_EXTRACT_FAILED_ACTION_EN}" \
      "extract result=fail method=${_METHOD} missing=HiWork.exe instDir=$INSTDIR" \
      "extract result=fail method=${_METHOD} missing=HiWork.exe instDir=$INSTDIR"
  ${Else}
    !insertmacro AIONUI_SLOG "event=extract result=ok method=${_METHOD} detail=customFiles_${AIONUI_TARGET_ARCH}"
  ${EndIf}
!macroend

!macro AIONUI_SESSION_SUCCESS
  !insertmacro AIONUI_SLOG "event=session-end result=success detail=customInstall"
!macroend

!endif
