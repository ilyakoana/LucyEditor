# NekoNovel 1.50 Engine – Command Reference
*(Used in Lucy -The Eternity She Wished For-)*

This document lists the scripting commands observed in the game’s `.txt` script files.  
Commands are written in Korean. Arguments follow the command name, separated by spaces.

---

## 1. Dialogue & Text

| Command | Description | Example |
|---------|-------------|---------|
| `대사` | Display normal dialogue text | `대사 Hello, how are you?` |
| `대사새줄` | Force a new line in dialogue | `대사새줄` |
| `대사잇기` | Continue previous dialogue on the same line / next line | `대사잇기 This is a continuation.` |
| `대기` | Wait for player click to continue | `대기` |
| `대사지우기` | Clear current dialogue text | `대사지우기` |
| `대사크기` | Change dialogue text size | `대사크기 50` / `대사크기 35` |
| `보이스` | Play voice file (or clear voice) | `보이스 lucy0001_{{$언어}}.mp3` |

**Common pattern for multi-line dialogue:**
```txt
대사 First sentence.
대기
대사새줄
대사잇기 Second sentence that continues.
대기

2. Character Names



































CommandDescriptionExample스크립트 이름.txt 주인공Show protagonist name스크립트 이름.txt 주인공스크립트 이름.txt 안드로이드Show Android / Lucy name스크립트 이름.txt 안드로이드스크립트 이름.txt 안드로이드1Alternative Android name variant스크립트 이름.txt 안드로이드1스크립트 이름.txt 이름지우기Hide character name스크립트 이름.txt 이름지우기스크립트 이름.txt 이름지우기대사창Hide name + dialogue window스크립트 이름.txt 이름지우기대사창

3. Images / CG / Backgrounds




























































CommandDescriptionExampleCGDisplay an image / CGCG bg_neon01 bg_neon01.jpg페이드인Fade in an object페이드인 bg_neon01 2000페이드아웃Fade out an object페이드아웃 bg_neon01 2000배경Change background배경 bg_room01_light bg_room01_light.jpg배경룰페이드인Fade in background with rule/transition배경룰페이드인 룰_47.png 500배경룰페이드아웃Fade out background with rule배경룰페이드아웃 룰_20.png 500크기Scale an object크기 bg_dump01big 2 2 0이동Move an object이동 bg_dump01big 0 -150 20 0진동Shake / vibrate an object진동 {{루시}} 3 1 1500 800출력순서Set draw / z-order출력순서 CG갤러리해금 -131
Notes:

Many CGs use variables: ev{{$skin}}01_1.jpg, l{{$skin}}02.png
-198, -199, -130 etc. are often used as layer / priority values


4. Audio



































CommandDescriptionExample효과음Play sound effect효과음 crowd crowd.mp3 반복배경음악Play background music배경음악 반복 kyoumei.mp3페이드인 배경음악Fade in BGM페이드인 배경음악 1000페이드아웃 배경음악Fade out BGM페이드아웃 배경음악 3000페이드아웃 (on sound)Fade out a specific sound페이드아웃 crowd 2000

5. Timing & Flow Control








































CommandDescriptionExample딜레이Wait X milliseconds딜레이 1500점프Jump to another script or label점프 로봇3원칙.txt 첫줄북마크Create a label / bookmark북마크 깜짝놀랐잖아조건Conditional jump조건 $버려진로봇트로피 = 1 여기 깜짝놀랐잖아변수Set a variable변수 chapter = 01변수 $name = valueSet special variable변수 $ev01_1획득 = 1

6. Threads (Parallel Execution)




















CommandDescriptionExample쓰레드Start a named thread / parallel action쓰레드 FOOTSTEPSWalkTrainersAsphaltSlow페이드아웃쓰레드시작Begin thread execution쓰레드시작
Threads are commonly used for simultaneous fades, movements, and sound effects.

7. System & UI
















































































CommandDescriptionExample스크립트Call / load another script스크립트 대화창함수.txt스크립트 대화창함수.txt 페이드인 대사창 500Fade in dialogue window—스크립트 대화창함수.txt 페이드아웃 대사창 1000Fade out dialogue window—스크립트 스킵메뉴창.txt 봉인Lock skip menu—스크립트 스킵메뉴창.txt 해제Unlock skip menu—키처리Handle key input키처리 32 텅빈.txt 첫줄시스템버튼Create clickable button / choice(complex, used for choices)라벨Create on-screen label / text라벨 CG갤러리해금 376 46 ...라벨속성Set label properties (font, size...)라벨속성 CG갤러리해금 30 아니 NanumGothic오마케추가Add to CG gallery / omake오마케추가 ev01_1 ev01_1.jpg게임상태Save / update game state게임상태모두지우기Clear everything on screen모두지우기대사창감추기Hide dialogue window대사창감추기회상초기화 / 회상첫설정 / 회상설정Recollection / memory system setup—

8. Common Useful Patterns
Basic Dialogue Block
txt스크립트 이름.txt 주인공
대사 “Some dialogue.”
대기
스크립트 이름.txt 이름지우기
Scene Transition
txt스크립트 대화창함수.txt 페이드아웃 대사창 500
페이드아웃 current_bg 2000
딜레이 1000
배경 new_bg new_bg.jpg
페이드인 new_bg 2000
스크립트 대화창함수.txt 페이드인 대사창 500
Choice (simplified structure)
txt시스템버튼 choice_bar2_1 0 142 1280 55 점프 chapter1.txt 꽂아본다 ...
Achievement Unlock
txt변수 $버려진로봇트로피 = 1

9. Notes for Editors / Tools

Commands are case-sensitive and must be written exactly as shown.
Most timing values are in milliseconds.
Variables often use $ prefix for special flags ($ev01_1획득, $skin, $언어…).
Many image/sound names support {{$skin}} and {{$언어}} placeholders.
Always keep 대기 after dialogue if you want the player to click to continue.
Threads (쓰레드 + 쓰레드시작) are essential for smooth parallel animations.