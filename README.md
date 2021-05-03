# OpenTrivia

This is a simple app to retrieve and display trivia questions, and answers, from the OpenTriviaDB website (https://opentdb.com/). 

The retrieved trivia is displayed by category in a list. Click on a category in the list to view one question and answer from that category. You may also filter the categories by typing text into the 'Filter' field. It will do a case-insensitive search and display categories that contain that text. 

The 'Quantity' field allows you select the number of trivia categories to retrieve.
The 'Delay' checkbox and accompanying field allow you to impose a simulated network delay in milliseconds when retrieving trivia.
In addition to retrieving the trivia on startup, the 'refresh' button allows you to trigger the retrieval manually.
The 'Cause Error on Fetch' checkbox will cause the retrieval to fail and an error message will be displayed.


### Notes/implementation details:

Localstorage is utilized to persist the 'Quantity', 'Delay', and 'Cause Error on Fetch' settings.
A debouncer is used for the filtering field - delaying the filtering action until 2 seconds have passed since the last input character.
A throttle is used for the Refresh button - allowing only one fetch to occur in a 2 second period. 

To run, simply click here:  https://markm7777.github.io/OpenTrivia/ (it's hosted on github via gh-pages)

 
