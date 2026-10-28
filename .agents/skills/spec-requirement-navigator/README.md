# Spec Requirement Navigator

**디지털키 요구사항을 찾고, 적용 조건과 예외를 해석하며, 원문 근거까지 확인하는 Codex Skill**

[에이전트 지침 보기 (SKILL.md)](./SKILL.md) · [전체 Skill 계획](../../../docs/skills-plan.md) · [프로젝트 개요](../../../README.md)

## 무엇을 해결하나요?

스펙 문서가 길고 버전이 여럿이면 "어느 Section에 있지?", "이 기능은 필수야?", "예외는 없나?"를 확인하는 데 시간이 많이 들어요. 이 Skill은 Codex가 **문서를 찾아보는 절차**를 일정하게 따르도록 도와줍니다.

1. 사용자의 질문을 기능·동작 주체·조건·버전으로 분해합니다.
2. 관련 Requirement를 검색하고 원문을 확인합니다.
3. 참조하는 다른 Requirement와 예외 조건을 함께 살펴봅니다.
4. **사실 / 해석 / 미확인 사항**을 구분해 출처와 함께 답합니다.

> **현재 데이터는 모두 독립 창작 합성 규격입니다.** `data/demo/spec-v1.json`과 `spec-v2.json`의 V1/V2는 실제 CCC Digital Key 3.1.4/4.1.0 버전이 아닙니다. 이 Skill의 데모 답변을 실제 CCC 구현 요구사항으로 사용하면 안 됩니다.

## 사용 준비

- GitHub 저장소를 로컬에 클론하고 **저장소 루트 디렉터리에서 Codex를 실행**합니다.
- 이 폴더의 `SKILL.md`는 에이전트 지침이고, 이 `README.md`는 사람이 읽는 사용 설명서입니다.
- 별도의 유료 API 키나 실행 중인 Vercel 서버는 **현재 합성 데이터 Skill 시연에는 필요하지 않습니다**. Codex가 저장소의 JSON을 직접 읽을 수 있으면 됩니다.
- Skill이 자동 선택되지 않는 경우 프롬프트 첫 줄에 `$spec-requirement-navigator`를 명시합니다. Codex 환경에 따라 발견·호출 방식은 다를 수 있으므로 실제 세션에서 확인하세요.
- 아직 **Local MCP 서버는 구현되지 않았습니다**. 이후 구현되면 동일한 절차에서 승인된 MCP 검색 도구를 사용할 예정입니다.

## 사용 예시 ① — UWB 실패 시 NFC fallback

Codex에 아래처럼 입력해보세요.

```text
$spec-requirement-navigator

가상 V2 스펙에서 UWB ranging 실패 시 NFC fallback이 가능한 조건을 찾아줘.
관련 Requirement ID, 적용 조건, 예외 사항과 원문 근거를 함께 설명해줘.
```

**확인해야 할 핵심 근거**

| 합성 Requirement | 검토할 내용 |
| --- | --- |
| `DEMO-V2-REQ-010` | UWB ranging이 불가능하거나 신뢰도가 낮은 경우의 동작 |
| `DEMO-V2-REQ-011` | 별도 NFC tap-to-access의 조건 |
| `DEMO-V2-REQ-012` | Credential에 설정된 채널/동작 권한 |

**기대하는 답변의 형태** (정답을 복사한 출력 예시가 아니라, 검증할 기준):

- 검색 범위가 **가상 V2**임을 명시
- `NFC로 무조건 대체 가능` 같은 단정 대신 **credential 권한과 명시적 tap 조건**을 설명
- 존재하는 Requirement ID와 **실제 JSON 텍스트 그대로의 인용**을 제시
- 다른 Version의 요구사항을 몰래 섞지 않음
- 충분한 근거가 없으면 `근거 부족` 또는 확인이 필요한 조건을 표시

## 사용 예시 ② — V1/V2 비교

```text
$spec-requirement-navigator

가상 V1과 V2에서 Friend Device의 재공유(delegation) 조건이 어떻게 다른지 비교해줘.
서로 다른 버전의 Requirement와 근거를 분리해 설명해줘.
```

- V1은 `DEMO-V1-REQ-004`, V2는 `DEMO-V2-REQ-004`를 우선 살펴봅니다.
- V2의 위임 조건을 설명할 때 연결된 `DEMO-V2-REQ-003`, `DEMO-V2-REQ-012`의 권한 제한도 검토할 수 있습니다.
- **V1/V2가 서로 다른 가상 규격**이라는 점을 표시해야 합니다.

## 사용 예시 ③ — 답할 수 없는 질문

```text
$spec-requirement-navigator

가상 규격에서 우주선 추진엔진 인증 요구사항을 찾아줘.
```

올바른 동작은 존재하지 않는 Section을 만드는 것이 아니라 **`Insufficient Evidence / 근거 부족`**이라고 답하는 것입니다.

## 결과 확인 체크리스트

- [ ] 질문한 버전만 검색했나요?
- [ ] `documentId`, `version`, `sectionId`, `requirementId`를 확인했나요?
- [ ] 인용문이 `data/demo/`에 있는 원문과 일치하나요?
- [ ] `SHALL / SHOULD / MAY`와 조건·예외를 구분했나요?
- [ ] 원문에 없는 추론을 사실로 단정하지 않았나요?

**다음 단계:** 이 답변을 [Spec Answer Auditor](../spec-answer-auditor/README.md)로 다시 검토해보세요.

## 웹앱과 MCP는 어떤 관계인가요?

- **이 Skill**: Codex에게 검색·해석·검증 순서를 안내합니다. 자체 검색 서버나 LLM API가 아닙니다.
- **과제용 Vercel Web**: 합성 데이터 + 검색 엔진 + OpenRouter 무료 LLM을 이용하는 **별도의 UI**입니다. Vercel이 이 `SKILL.md`를 실행하는 구조는 아닙니다.
- **후속 Local MCP**: 실제 CCC PDF를 승인된 로컬 환경에서 색인·검색하고, 사내 계약된 Codex·Claude·Gemini에 검색 도구를 제공합니다. 이 Skill은 그 도구를 이용하는 조사 절차로 재사용될 수 있습니다. 단, 다른 에이전트가 Codex Skill 파일을 그대로 지원하는지는 별도 확인해야 합니다.

**보안:** 실제 CCC/OEM/사내 문서나 파생 인덱스를 Public GitHub, Vercel, 개인 OpenRouter 서비스에 업로드하지 않습니다. 사내 사용은 허용된 문서·AI 환경에서만 수행합니다.

## 관련 파일

- [SKILL.md](./SKILL.md): 에이전트가 따르는 세부 지침
- [가상 V1](../../../data/demo/spec-v1.json) / [가상 V2](../../../data/demo/spec-v2.json): 데모 원문
- [평가 질문](../../../evals/questions.json): 회귀 테스트용 예시 질문
- [Skill 로드맵](../../../docs/skills-plan.md): 추가 Skill과 MCP 연동 계획
