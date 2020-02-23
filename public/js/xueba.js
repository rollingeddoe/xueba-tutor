

function switchsign() {
    var x = document.getElementById("change");
    if (x.textContent === "Sign Up") {
        window.location.replace('/register')
    }
    else {
        window.location.replace('/login')
    }
}


document.getElementById("subDep").hide();

function submitDep(){
    document.getElementById("subDep").click()
}




function postSection (questionTitle, answerOptions) {
    $('#postSection').show().empty()
    $(`<div class="question">
        <div class="question-number">Question #${currentQuestionNumber}</div>
        <div class="question-title"></div>
        <div class="question-options">
            <div class="question-option">
                <label>
                    <input type="radio" name="answerChoice" value="${answerOptions[0]}">
                    ${answerOptions[0]}
                </label>
            </div>
            <div class="question-option">
                <label>
                    <input type="radio" name="answerChoice" value="${answerOptions[1]}">
                    ${answerOptions[1]}
                </label>
            </div>
            <div class="question-option">
                <label>
                    <input type="radio" name="answerChoice" value="${answerOptions[2]}">
                    ${answerOptions[2]}
                </label>
            </div>
            <div class="question-option">
                <label>
                    <input type="radio" name="answerChoice" value="${answerOptions[3]}">
                    ${answerOptions[3]}
                </label>
            </div>
        </div>
        <button class="submit-answer btn btn-primary btn-lg">Submit Answer!</button>
      </div>`)
    .appendTo($('#active-game-wrapper'))
}


function checktime() {
    var start_time = $("#Record_starttime").val();
    var end_time = $("#Record_endtime").val();
    if (start_time > end_time) {
        console.log( $("#Record_Start_Time"));
        $("#Record_starttime").after('<span class="error"><br>Start-time must be smaller then End-time.</span>');
        $("#Record_endtime").after('<span class="error"><br>End-time must be bigger then Start-time.</span>');
        return false;
    } else {
        $('.error').remove();
    }
}


$('button.bookButton').on('click', function(e){
    e.preventDefault();
    $button = $(this);
    if (confirm("Confirm your order?")) {
        $button.addClass('booked');
        $button.text('Booked');
        e.preventDefault();
    } 
    else {
        $button.text('Book Section');
    }
});

// $(document).ready(function(){
//     $("div.list").slice(1,15).slideUp();
//     $("#loadMore").click(function(e){
//       e.preventDefault(); 
//       $("div.list").slice(1,15).slideDown();
//     });
//     $("#showless").click(function(e){
//       e.preventDefault();  
//       $("div.list").slice(1,15).slideUp();
//     });
// });

// $(#loadMore").on("click", function(e) {

// })