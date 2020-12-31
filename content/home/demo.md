---
# An instance of the Blank widget.
# Documentation: https://sourcethemes.com/academic/docs/page-builder/
widget: blank

# Activate this widget? true/false
active: true

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 999


subtitle:
design:
  columns: "1"
  
  spacing:
    padding: ["20px", "0", "20px", "0"]
---
Netlify build status, should be "Success"
[![Netlify Status](https://api.netlify.com/api/v1/badges/43a8e219-6710-4142-aed9-79413987332b/deploy-status)](https://app.netlify.com/sites/tonylam/deploys)


Commits to this site's Github {{< icon name="github" pack="fab" >}} repo
<div id='commits' data-path='src/io/trivium/extension/'></div>
<script src='https://code.jquery.com/jquery-2.2.1.min.js'></script>
<script>
var path = $('#commits').data('path');
var url = 'https://api.github.com/repos/lamtonylam/starter-academic/commits?path'+path;
$.ajax({type:'GET',
        url:url,
        success: function(data){
    var str="<table class='docutils'><thead><tr><th>message</th><th>date</th><th>author</th><th>link</th></tr></thead><tbody>";
    for(var idx=0;idx<data.length && idx<10;idx++){
      var one = data[idx];
      var d = one.commit.author.date.substr(0,10);
      var t = one.commit.author.date.substr(11,10);
      str+="<tr><td>"+one.commit.message+"</td><td>"
          +d+" "+t+"</td><td>"
          +one.commit.author.name+"</td><td>"
          +"<a href='"+one.html_url+"'>"+one.sha.substr(0,7)+"</a></td></tr>";
    }
    str+="</tbody></table>";
    $('#commits').html(str);
}});
</script>

GitHub {{< icon name="github" pack="fab" >}} contributions calendar
<!-- Include the library. -->
<script
  src="https://unpkg.com/github-calendar@latest/dist/github-calendar.min.js"
></script>

<!-- Optionally, include the theme (if you don't want to struggle to write the CSS) -->
<link
   rel="stylesheet"
   href="https://unpkg.com/github-calendar@latest/dist/github-calendar-responsive.css"
/>

<!-- Prepare a container for your calendar. -->
<div class="calendar">
    <!-- Loading stuff -->
    Loading the data just for you.
</div>

<script>
    GitHubCalendar(".calendar", "your-username");
    // or enable responsive functionality
    GitHubCalendar(".calendar", "lamtonylam", { responsive: true });
</script>