'use strict';
 
angular.module('mean.movies').controller('MoviesMainController', ['$scope', '$stateParams', '$location', '$timeout', '$http', 'Global','Movies', 'Users',
 'AuthService',
  function($scope, $stateParams, $location,  $timeout, $http, Global, Movies, Users, AuthService) {
    $scope.global = Global;
    $scope.error = "";
    $scope.filterText = '';

    $scope.user = AuthService.currentUser();
    $scope.logged = AuthService.isLoggedIn();

    $scope.$watch( AuthService.isLoggedIn, function ( isLoggedIn ) {
      $scope.logged = AuthService.isLoggedIn();
      $scope.user = AuthService.currentUser();
  });

    $scope.setMovie = function(movie){
         $location.path('/movies/' + movie.id); 
    };

    $scope.getRating = function(movie) {
    return new Array(movie.grade);   
    }
    //get user watched list
    $scope.getUserWatchedList = function(user) {
       Movies.getUserRatings.get({},{'user': user}, function (response){
          $scope.watched_list = response.ratings;
       });
    }

    //returns movie ratings returned from Trakt
    $scope.synchronizeTrakt = function(user, traktUser, traktPassword) {
      Movies.synchronizeTrakt.query({},{user: user, traktUser: traktUser, traktPassword: traktPassword}, function (response){ 
        $scope.getUserWatchedList(user);
      });
    }

    //synchronize ratings
    //$scope.synchronizeTrakt("Teste1", "Acaldas", "qweasd");

    //get recomendation
    $scope.getRecomendation = function(user) {
      Movies.getRecomendation.query({},{user: user}, function (response){ 
        $scope.recomendation_movies = response.movie;
      });
    }
    //$scope.getRecomendation("Teste1");

    $scope.login = function(name, password) {
      Users.login.query({},{name: name, password: password}, function (response) {
        $scope.status = response.status;
        if($scope.status === "Success") {
          AuthService.login({user: name, password: password});
          $scope.user = AuthService.currentUser();
          $scope.logged = true;
          $scope.getRecomendation(name);
          $scope.getUserWatchedList(name);
        }
      });
    }

    $scope.logout = function() {
      $scope.user = "";
      $scope.logged = false;
      AuthService.logout();
    }

    $scope.addUser = function(name, password, traktusername, traktpassword) {
      Users.addUser.query({},{name: name, password: password}, function (response) {
        console.log(response.status);
        if(response.status === "Success") {
          $scope.login(name,password);
          $scope.registerError = null;
          if(traktusername!=null && traktpassword != null)
              $scope.synchronizeTrakt(name,traktusername, traktpassword);
        } else
          $scope.registerError = response.status;
      }); 
    }
        
    $scope.addRating = function(user, movieId, grade) {
    Users.addRating.query({},{user: user, movie: movieId, grade: grade}, function (response) {
      console.log(response);
    });
  }
  
  $scope.quickMovie = null;
  $scope.showQuickMovie = false;
  $scope.genreFiltered = false;


  //set quick description movie
  $scope.setQuickMovie = function(movie){ 
    Movies.getMovies.get({},{'id': movie.id}, function (response){                         
      $scope.quick_similar_movies = response.similar_movies.similar_movie;
      $scope.quickMovie = response;
      $scope.showQuickMovie = true;
    });             
  };
  $scope.hideQuickMovie = function() {
    $scope.showQuickMovie = false;
  };

  $scope.showGenre = function(genre) {
    $scope.genreFiltered = true;
    $scope.genre = genre.name;
    $scope.genreMovies = genre.movie;
  };


  //get most rated movies
  Movies.getSpecialList.get({},{'type': 1}, function (response){
      $scope.mostRatedMovies = response.most_rated.movie;
    });

  //get best rated movies
  Movies.getSpecialList.get({},{'type': 2}, function (response){
      $scope.bestRatedMovies = response.best_rated.movie;
    });

  //get top movies by genre
  Movies.getSpecialList.get({},{'type': 3}, function (response){
      $scope.bestGenreMovies = response.genres;
      console.log($scope.bestGenreMovies);
    });

    $scope.filterTypes = [
     { id: 1, name: 'Everything' },
     { id: 2, name: 'Title' },
     { id: 3, name: 'Synopsis' },
     { id: 4, name: 'Actor' },
     { id: 5, name: 'Director' }
   ];

   $scope.selectedFilterType = $scope.filterTypes[0];
    var filterTextTimeout;
    var start = 1;
    var max = 20;

    var filter;
    $scope.getMovies = function () {
      Movies.getMovies.query({},{start: start, filter: filter, filterType: $scope.selectedFilterType.id}, function (response){ 
        if(response.movie) {//check if some movie was found 
          $scope.error = "";
          if(response.movie.length) //check if search returned various movies or only one
            $scope.movies = response.movie;    
          else
            $scope.movies = response;
        } else {
          $scope.movies = {};
          $scope.error = "No movies found"
        }

      });

    };

    $scope.$watch('searchText', function (val) {
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
        filter = val;
        filterTextTimeout = $timeout($scope.getMovies, 200); // delay 250 ms
    }); 

     $scope.$watch('selectedFilterType', function(val) {
      $scope.getMovies();
     });
    
      // $scope.update = Movies.update.query(function(response) {
      // Movies.getMovies.query(function (response){ 
      //     $scope.movies = response.movie;
      //   });
      //   }); //get movies
  }
])
.controller('MovieController', ['$scope', '$location', '$stateParams', 'Movies', function($scope, $location, $stateParams, Movies) {
  
  Movies.getMovies.get({},{'id': $stateParams.id}, function (response){
    $scope.error = response.error;
    $scope.movie = response;                          
    $scope.similar_movies = response.similar_movies.similar_movie;
    $scope.genres = response.genres.genre;
    $scope.cast = response.cast.actor;
    $scope.directors = response.directors.director;
    $scope.score = parseInt(response.ratings.critic_score, 10);

    $scope.setMovie = function(movie){
           $location.path('/movies/' + movie.id); 
      };    
  });            

}]);