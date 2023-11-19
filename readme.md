## Software Engineering Excellence: MVP for a geo-distance, weighted ranking algorithm

## Story of hackaton and development

### Inspiration
Create the best performans for amaizing user experience.

### What it does
1. Find the best service providers using ranging algorithm, that takes into accont distance and provider's scores.
2. Change server providing description, picture score or maximum driving distance by provider id.

### How we built it
1. Figure out app atributes we can preprocess once and then use. For example we enrich longitute and latituge with potGis Point, which reduced the time required for calculating distances between two points.
2. Found a tree alghorithm to filter as much unpossible pairs (postcode - service provider) as possible, but then found the same concept withing SQL alghorithm and choose the last one :) The performance became 10 times faster.
3. Save the result (2) as a pre-calculated table with all possible PLZ for the every service provider (with a 5km tolerance) in order to cover the worse cases.
4. Write an scripts to calculate ranged list of service provider by given PZL and for abdating service provider & (3) tables.
5. Indexes metter for faster search. 9s vs 100ml for the table with 120M rows.
6. Add backend...
7. Frontend...
8. And a little bit (a lot of) beauty for the users

### Challenges we ran into
1. It difficult (very very long and unproductive) to directly calculate matrix of distances with 68000x8000 dimention from nummerical point of view.
2. All PLZ neighbourhoods have different squares and form, therefore they can not be represented with mean cercles or squares.
3. Learn frontend, backend, sql and docker within a day.
4. Calculating even optimized matrix of sever providers over poscodes and then inserting the data to the database during the start of docker-compose was a tough task for our laptops.

### Accomplishments that we're proud of (quotes)
1. It works.
2. I've seen frontent and backend first time in my live and developed them in JS.
3. I've found out the power of indexes in SQL.
4. User dont have to wait 5 hours to recieve the answer))) they dont have to wait even 5s either.
5. We didn't give up... and didnt sleep.

### What we learned
1. JS, HTML, CSS, Docker, SQL, Node.js
2. Not to give up and not to give in... (to sleep)

### What's next for Kak-nibud
1. Sleep :)
2. Analyse the experience and decide what skills we need to improve
3. Improve skils :)
4. Repeat

In case of project: UI, more features, dags for data predprocessing and scaling

### App TIY: Try It Yourself

#### How to start the app

1. Clone the project
2. Run `npm install`
3. To start `docker-compose up -d --build`
4. To stop `docker-compose stop`
5. And then open http://localhost:3000/ in browser.

#### How the application get data?

Database is filling when you run the application for the first time. The valume of database is about 1.3Gb.
Look at postgreSQL container log in order to see whether process is running.
This process might have time (10 min), but we'll explane how to make it better.