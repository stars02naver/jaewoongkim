/**
 * main.js
 * 포즈 인식과 게임 로직을 초기화하고 서로 연결하는 진입점
 *
 * PoseEngine, GameEngine, Stabilizer를 조합하여 애플리케이션을 구동
 */

// 전역 변수
let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;

/**
 * 애플리케이션 초기화
 */
async function init() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  startBtn.disabled = true;

  try {
    // 1. PoseEngine 초기화
    poseEngine = new PoseEngine("./my_model/");
    const { maxPredictions, webcam } = await poseEngine.init({
      size: 600,
      flip: true
    });

    // 2. Stabilizer 초기화
    stabilizer = new PredictionStabilizer({
      threshold: 0.35,
      smoothingFrames: 2
    });

    // 3. GameEngine 초기화 (선택적)
    gameEngine = new GameEngine();

    // 4. 캔버스 설정
    const canvas = document.getElementById("canvas");
    canvas.width = 600;
    canvas.height = 600;
    ctx = canvas.getContext("2d");

    // 5. Label Container 설정
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; // 초기화
    for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(document.createElement("div"));
    }

    // 6. PoseEngine 콜백 설정
    poseEngine.setPredictionCallback(handlePrediction);
    poseEngine.setDrawCallback(drawPose);

    // 7. PoseEngine 시작
    poseEngine.start();

    // 8. GameEngine Start Trigger (Auto start or via button)
    // 8. GameEngine Start Trigger
    gameEngine.setGameEndCallback((score, reason) => {
      // alert(`Game Over! (${reason})\nFinal Score: ${score}`); // Old way
      showGameOverModal(score, reason);
      stop();
    });

    gameEngine.start();

    stopBtn.disabled = false;
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    alert("초기화에 실패했습니다. 콘솔을 확인하세요.");
    startBtn.disabled = false;
  }
}

/**
 * Show Game Over Modal
 */
function showGameOverModal(score, reason) {
  const modal = document.getElementById("gameOverModal");
  const reasonText = document.getElementById("gameOverReason");
  const scoreText = document.getElementById("finalScore");

  reasonText.innerText = `Reason: ${reason}`;
  scoreText.innerText = score;
  modal.style.display = "block";
}

/**
 * Close Modal and Restart Game
 */
window.closeModalAndRestart = function () {
  const modal = document.getElementById("gameOverModal");
  modal.style.display = "none";
  init();
};

/**
 * 애플리케이션 중지
 */
function stop() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  if (poseEngine) {
    poseEngine.stop();
  }

  if (gameEngine && gameEngine.isGameActive) {
    gameEngine.stop();
  }

  if (stabilizer) {
    stabilizer.reset();
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

/**
 * 예측 결과 처리 콜백
 * @param {Array} predictions - TM 모델의 예측 결과
 * @param {Object} pose - PoseNet 포즈 데이터
 */
function handlePrediction(predictions, pose) {
  // 1. Stabilizer로 예측 안정화
  const stabilized = stabilizer.stabilize(predictions);

  // 2. Label Container 업데이트
  for (let i = 0; i < predictions.length; i++) {
    const classPrediction =
      predictions[i].className + ": " + predictions[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  // 3. 최고 확률 예측 표시
  const maxPredictionDiv = document.getElementById("max-prediction");
  maxPredictionDiv.innerHTML = stabilized.className || "감지 중...";

  // 4. GameEngine에 포즈 전달 (게임 모드일 경우)
  if (gameEngine && gameEngine.isGameActive && stabilized.className) {
    gameEngine.onPoseDetected(stabilized.className);
  }
}

/**
 * 포즈 그리기 콜백
 * @param {Object} pose - PoseNet 포즈 데이터
 */
function drawPose(pose) {
  if (poseEngine.webcam && poseEngine.webcam.canvas) {
    // 1. Draw Webcam Video
    ctx.drawImage(poseEngine.webcam.canvas, 0, 0);

    // 2. Draw Keypoints (Optional - maybe distracts from game? let's keep it subtle or remove)
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }

    // 3. Update and Render Game
    if (gameEngine && gameEngine.isGameActive) {
      gameEngine.update(ctx.canvas.width, ctx.canvas.height); // Update game state
      gameEngine.render(ctx, ctx.canvas.width, ctx.canvas.height); // Render game elements
    }
  }
}

// 게임 모드 시작 함수 (선택적 - 향후 확장용)
function startGameMode(config) {
  if (!gameEngine) {
    console.warn("GameEngine이 초기화되지 않았습니다.");
    return;
  }

  gameEngine.setCommandChangeCallback((command) => {
    console.log("새로운 명령:", command);
    // UI 업데이트 로직 추가 가능
  });

  gameEngine.setScoreChangeCallback((score) => {
    console.log(`점수: ${score}`);
  });

  gameEngine.setGameEndCallback((finalScore, reason) => {
    console.log(`게임 종료! 최종 점수: ${finalScore}, 사유: ${reason}`);
    alert(`게임 종료!\n사유: ${reason}\n최종 점수: ${finalScore}`);
  });

  gameEngine.start(config);
}
