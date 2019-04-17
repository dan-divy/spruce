/****
Copyright Divy Srivastava 2019

/public/javascript/comment.js
****/

// Add an event listener to the comment input box with jquery `.on()`
$(".comment-input-box").on("keydown",commentById)

// Comment function by ID when enter is pressed...
function commentById(key) {
  if(!this.value) return;
  else if(key.keyCode == 13) {
    // Ajax post call for HTTP post
    var author = $(`#${this.id}`).attr("author");
    console.log(author)
    $.ajax({
        method: 'POST',
        url: '/api/v1/comment',
        data: {
          "_id":this.id,
          "author":author,
          "text":this.value
        }
    })
    .done(function(data){
      show_notification('Adding comment!','success')
      setTimeout(()=> {window.location.reload()}, 1000)

    })
    .fail(function(data){
      show_notification('Some error while posting the comment.','danger')
      console.log(data)  
    });
  }
}