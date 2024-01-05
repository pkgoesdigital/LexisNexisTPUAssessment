let score = 0;
let level = 0;
let next = 0;
let trackingIndex = 0;
let question = 0; // true or false, handle logic based on answer (is legacy or not)
let isOnAnswerCalled = false; // Handles disabling the continue-btn until an answer is selected
let answer = null;
let answers = {};
let path = [];
const letters = ["A.", "B.", "C.", "D.", "E.", "F."]; // Corresponds to each answer index
let phase = "survey";
let isOnPathA = true;
let percentCalc = 0;
let pathAQuestionCount = 0;
let pathBQuestionCount = 0;
let currentStep = data.steps[0];
let urlWithParams = "";

const urlResultTarget = "https://solutions.risk.lexisnexis.com/tpu-results";

const radioInactiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/></svg>`;
const radioActiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" fill="#FFF"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>`;

// on Dom Ready
$(document).ready(function () {
  $(".answer").on("click", onAnswer);
  $("#continue-btn").on("click", onContinue);
  $("#back-btn").on("click", goBack);
  populateStep();
});

// on Window resize
$(window).resize(
  debounce(function () {
    let percentage = $(".progress-percentage").text().replace("%", "");
    $("#hiker").css(
      "margin-left",
      $(".progress-container").width() * (percentage * 0.01) - 50
    );
    $("#hiker").css("border-radius", "80px");
  })
);

// debounce function for window resizing
function debounce(func) {
  var timer;
  return function (event) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(func, 100, event);
  };
}

// update the hiker and progress bar display
function updateProgressBar(percentage) {
  const progressBarFill = document.querySelector(".progress-bar__fill");
  const progressPercentage = document.querySelector(".progress-percentage");
  progressBarFill.style.width = percentage + "%";
  progressPercentage.textContent = percentage + "%";
  $("#hiker").css(
    "margin-left",
    $(".progress-container").width() * (percentage * 0.01) - 50
  );
}

// move to the next UI phase
function nextPhase() {
  if (phase === "survey") {
    phase = "summary";
    $("#welcome, #survey").hide();
    $("#summary").show();
    displayFinalSummary(score);
    // tpu_score = score, tpu_level = level, tpu_user_response = answer to branching question (question 3)
    urlWithParams =
      urlResultTarget +
      "?tpu_score=" +
      score +
      "&tpu_level=" +
      level +
      "&tpu_user_response=" +
      question;
    return;
  }
}

// display final summary details
function displayFinalSummary(finalScore) {
  $("#final-headline").show();
  $("#final-body").show();
  $("#custom-report-btn").show();
  const result = data.results.find(
    (r) => finalScore >= r.min && finalScore <= r.max
  );
  if (result) {
    // Assign level from result for passing via url parameters
    level = result.level;
    $("#final-level")
      .text("You are... Level " + result.level + " of 5")
      .addClass("level");
    $("#final-rank").text(result.name).addClass("rank");
    $("#final-svg").html(result.svg);
    $("#final-headline")
      .html(result.headline.replace("TM", "<sup>TM</sup>"))
      .addClass("context");
    $("#final-body").html(result.body).addClass("context");
  }
}

// handle the answer submit
function onAnswer() {
  const _step_id = currentStep.id;
  const _idx = $(this).attr("idx") * 1;
  answer = currentStep.answers[_idx];
  next = data.steps.find((_s) => _s.id === answer.next);

  // Remove "active" class from all answers
  $(".answer").removeClass("active");
  // Add "active" class to the selected answer
  $("#question-" + _idx).addClass("active");
  // Make continue button appear as activated once a user has made a selection
  $("#continue-btn")
    .css("background-color", "#ED1C24")
    .css("cursor", "pointer");

  $(".answer .radio-svg").html(radioInactiveSvg);
  $(".answer.active .radio-svg").html(radioActiveSvg);

  // Set the flag to true, indicating onAnswer() has been called
  isOnAnswerCalled = true;

  // If we're on the third question
  if (_step_id === 300) {
    // Save off answer index to use in url query string to pass to LN
    question = answer.sort;
    // if answer to question is not 1 (aka A), then we're on path B. If it is 1, then they're an Observer
    if (answer.sort !== 1) {
      isOnPathA = false;
    }
  }

  // Scroll to the top of the screen on mobile devices
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    window.scrollTo(0, 0);
  }
}

// Reinit and populate step
function populateStep() {
  if (currentStep) {
    // init/show the UI
    $("#welcome, #summary").hide();
    $("#survey").show();
    $("#continue-btn").show();

    const rate = 250;

    $("#question-num").fadeOut(rate, function () {
      $(this).text(currentStep.questionNum).fadeIn(rate);
    });

    $("#step-title").fadeOut(rate, function () {
      $(this).text(currentStep.question).fadeIn(rate);
    });

    // Only show context on first question
    if (path.length) {
      $("#step-context").hide();
    } else {
      $("#step-context").fadeOut(rate, function () {
        $(this)
          .text(
            "Choose the response that most accurately reflects your process"
          )
          .fadeIn(rate);
      });
    }

    if (currentStep.isFinal) {
      // Swap out the text on the continue button
      $("#continue-btn p").text("View Results");
      // Remove second question group on last step
      $("#question-group-2").addClass("hide");
      $("#question-3").removeClass("answer").addClass("hide");
      $("#question-4").removeClass("answer").addClass("hide");
    } else {
      // Make sure to swap text back if user decides to go back on last step
      $("#continue-btn p").text("Next Question");
    }

    currentStep.answers.forEach((_step, _idx) => {
      const $question = $("#question-" + _idx);
      $question.delay(_idx * 100 + rate * 0.75).fadeTo(rate, 0, function () {
        if (currentStep.answers[_idx].answer) {
          $question
            .html(
              "<div class='radio-svg'>" +
                radioInactiveSvg +
                "</div>" +
                "<div>" +
                letters[_idx] +
                "</div>" +
                currentStep.answers[_idx].answer
            )
            .removeClass("active")
            .fadeTo(rate, 1);
        }
      });
    });

    // cleanup for any remaining questions
    for (let _idx = currentStep.answers.length; _idx < 15; _idx++) {
      $("#question-" + _idx)
        .delay(_idx * 100 + rate * 0.75)
        .fadeTo(rate, 0);
    }

    // If on first step, hide back button with css
    if (!path.length) {
      $("#back-btn").removeClass("back-btn").addClass("back-btn-hidden");
      $("#previous").removeClass("previous").addClass("previous-hidden");
      $("#previous-svg").addClass("hide");
    } else {
      // Otherwise always show back button
      $("#back-btn").show();
      $("#previous").removeClass("previous-hidden").addClass("previous");
      $("#previous-svg").removeClass("hide");
    }

    // If phase isn't survey, hide the continue button
    if (!phase === "survey") {
      $("#continue-btn").hide();
    }

    // Disable the continue button based on flag and change background color to indicate
    $("#continue-btn")
      .prop("disabled", isOnAnswerCalled)
      .css("background-color", "#C2C2C2")
      .css("cursor", "default");
  }
}

// calc the score, show it inline for survey
function populateScore(questionIndex) {
  let _score = 0;
  Object.keys(answers).forEach((_key) => {
    _score += answers[_key].weight;
  });
  score = _score;
  $("#score").text("Score: " + score);
  // Account for first three questions taking up only 33 percent of survey
  if (!(questionIndex === undefined)) {
    if (questionIndex <= 2) {
      percentCalc += 11;
    } else if (questionIndex > 2) {
      if (isOnPathA) {
        // Use 66% because 33% is covered in first three questions - 66% is remaining percentage
        percentCalc += Math.round(66 / pathAQuestionCount);
      } else {
        percentCalc += Math.round(66 / pathBQuestionCount);
      }
    }
  }
}

// continue button click handler
function onContinue() {
  if (!$(".answer.active").length) return;

  const _step_id = currentStep.id;

  path.push(currentStep);
  pathAQuestionCount = data.steps.filter((step) => step.id > 449).length;
  pathBQuestionCount = data.steps.filter(
    (step) => step.id < 449 && step.id > 399
  ).length;
  answers[_step_id.toString()] = answer;

  if (next) {
    currentStep = next;
    populateScore(trackingIndex);
    trackingIndex += 1;
  } else {
    // We still want to populate the score & update the progress bar on last
    populateScore(trackingIndex);
    trackingIndex += 1;
  }

  var isViewResults = $("#continue-btn p").text() === "View Results";
  if (!isViewResults) {
    populateStep();
    populateScore();
    updateProgressBar(percentCalc);
  } else {
    populateScore();
    nextPhase();
    return;
  }
}

// go backwards to the previous step
function goBack() {
  const _step = path.pop();
  trackingIndex -= 1;
  score -= answers[_step.id.toString()].weight;
  // Reset the continue if going back
  $("#continue-btn p").text("Next Question");

  // Subtract the corresponding value from percentCalc
  if (trackingIndex <= 2) {
    percentCalc -= 11;
  } else if (trackingIndex > 2) {
    if (isOnPathA) {
      percentCalc -= Math.round(66 / pathAQuestionCount);
    } else {
      percentCalc -= Math.round(66 / pathBQuestionCount);
    }
  }

  // Reset the isOnAnswerCalled flag to false when going back
  isOnAnswerCalled = false;

  currentStep = _step;
  delete answers[_step.id.toString()];
  populateStep();
  populateScore();
  updateProgressBar(percentCalc);
}
