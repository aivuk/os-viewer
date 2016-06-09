'use strict';

var _ = require('lodash');
var angular = require('angular');
var template = require('./template.html');

var availableVisualizations = [
  {
    id: 'Treemap',
    name: 'Tree Map',
    type: 'drilldown',
    embed: 'treemap',
    icon: 'os-icon os-icon-treemap'
  },
  {
    id: 'PieChart',
    name: 'Pie Chart',
    type: 'drilldown',
    embed: 'piechart',
    icon: 'os-icon os-icon-piechart'
  },
  {
    id: 'BubbleTree',
    name: 'Bubble Tree',
    type: 'drilldown',
    embed: 'bubbletree',
    icon: 'os-icon os-icon-bubbletree'
  },
  {
    id: 'BarChart',
    name: 'Bar Chart',
    type: 'sortable-series',
    embed: 'barchart',
    icon: 'os-icon os-icon-barchart'
  },
  {
    id: 'Table',
    name: 'Table',
    type: 'sortable-series',
    embed: 'table',
    icon: 'os-icon os-icon-table'
  },
  {
    id: 'LineChart',
    name: 'Line Chart',
    type: 'time-series',
    embed: 'linechart',
    icon: 'os-icon os-icon-linechart'
  },
  {
    id: 'Map',
    name: 'Map',
    type: 'location',
    embed: 'map',
    icon: 'os-icon os-icon-map'
  },
  {
    id: 'PivotTable',
    name: 'Pivot Table',
    type: 'pivot-table',
    embed: 'pivottable',
    icon: 'os-icon os-icon-layers'
  }
];

angular.module('Application')
  .directive('visualizations', [
    '$location', '$browser',
    function($location, $browser) {
      return {
        template: template,
        replace: false,
        restrict: 'E',
        scope: {
          state: '=',
          events: '=',
          type: '='
        },
        link: function($scope, element) {
          $scope.type = null;

          $scope.availableVisualizations = availableVisualizations;

          function resetOrderBy() {
            var state = $scope.state;
            if (!$scope.events) {
              return;
            }
            if (state.measures && state.measures.current) {
              $scope.events.toggleOrderBy(state.measures.current, true);
            }
            $scope.events.dropPivot('series', null, true);
            $scope.events.dropPivot('rows', null, true);
            $scope.events.dropPivot('columns', null, true);
            $scope.events.dropAllFilters();
          }

          $scope.selectedVisualizations = $scope.state.selectedVisualizations;
          if (!_.isArray($scope.selectedVisualizations)) {
            $scope.selectedVisualizations = [];
          }
          var visualization = _.first($scope.selectedVisualizations);
          visualization = _.find(availableVisualizations, function(item) {
            return item.id == visualization;
          });
          if (visualization) {
            $scope.type = visualization.type;
          } else {
            $scope.type = null;
          }

          $scope.getItemByKey = function(items, keys) {
            var result = null;
            if (_.isArray(items) && !!keys) {
              if (_.isArray(keys)) {
                keys = _.first(keys);
              }
              result = _.find(items, function(item) {
                return item.key == keys;
              });
            }

            if (result) {
              result.displayName = result.displayName || result.name ||
                result.value;
            }
            return result;
          };

          function updateAvailableVisualizations() {
            $scope.state.selectedVisualizations = $scope.selectedVisualizations;

            $scope.availableVisualizations = _.chain(availableVisualizations)
              .map(function(item) {
                if ((item.id == 'Map') && !$scope.geoViewAvailable) {
                  return null;
                }
                if ((item.id == 'LineChart') && !$scope.lineChartAvailable) {
                  return null;
                }

                var result = _.extend({}, item);
                result.isEnabled = true;
                if ($scope.type && (item.type != $scope.type)) {
                  result.isEnabled = false;
                }
                return result;
              })
              .filter()
              .value();
          }

          updateAvailableVisualizations();
          $scope.$watch('type', updateAvailableVisualizations);

          function updateSpecialChartTypes() {
            $scope.geoViewAvailable = false;
            $scope.lineChartAvailable = false;

            // GeoView
            if (
              $scope.state &&
              $scope.state.availablePackages &&
              $scope.state.availablePackages.locationAvailable
            ) {
              $scope.geoViewAvailable =
                $scope.state.availablePackages.locationAvailable;
            }

            // Line Chart
            if (
              $scope.state &&
              $scope.state.dimensions &&
              $scope.state.dimensions.items
            ) {
              $scope.lineChartAvailable = !!_.find(
                $scope.state.dimensions.items,
                function(dimension) {
                  return dimension.dimensionType == 'datetime';
                });
            }

            updateAvailableVisualizations();
          }

          updateSpecialChartTypes();
          $scope.$watch('state.availablePackages.locationAvailable',
            updateSpecialChartTypes);
          $scope.$watch('state.state.dimensions', updateSpecialChartTypes);

          $scope.getVisualizationById = function(visualization) {
            return _.find(availableVisualizations, function(item) {
              return item.id == visualization;
            });
          };

          var addVisModal = element.find('.x-visualization-add-modal').modal({
            show: false
          });

          var shareModal = element.find('.x-visualization-share-modal').modal({
            show: false
          });

          $scope.showAddVisualizationDialog = function() {
            addVisModal.modal('show');
          };

          $scope.showShareModal = function(visualization) {
            visualization = _.find(availableVisualizations, function(item) {
              return item.id == visualization;
            });
            if (visualization && visualization.embed) {
              var base = $browser.baseHref();
              if (base.substr(0, 1) != '/') {
                base = '/' + base;
              }
              if (base.substr(-1, 1) == '/') {
                base = base.substr(0, base.length - 1);
              }

              var protocol = $location.protocol() + '://';
              var host = $location.host();
              var port = $location.port() == '80' ? '' :
                ':' + $location.port();
              var url = $location.url();

              $scope.shareUrl = protocol + host + port + base +
                '/embed/' + visualization.embed + url;
              shareModal.modal('show');
            }
          };

          $scope.addVisualization = function(visualization, removeIfAdded) {
            var alreadyAdded = !!_.find(
              $scope.selectedVisualizations,
              function(item) {
                return item == visualization;
              }
            );

            if (!alreadyAdded) {
              $scope.selectedVisualizations.push(visualization);

              $scope.type = _.find(availableVisualizations, function(item) {
                return item.id == visualization;
              }).type;
              updateAvailableVisualizations();
            } else
            if (removeIfAdded) {
              $scope.removeVisualization(visualization);
            }

            if ($scope.availableVisualizations) {
              var availableVisIds = _.chain($scope.availableVisualizations)
                .filter(function(item) {
                  return item.isEnabled;
                })
                .map(function(item) {
                  return item.id;
                })
                .difference($scope.selectedVisualizations)
                .value();
              if (availableVisIds.length == 0) {
                addVisModal.modal('hide');
              }
            }
          };

          $scope.removeVisualization = function(visualization) {
            $scope.selectedVisualizations = _.filter(
              $scope.selectedVisualizations,
              function(item) {
                return item != visualization;
              }
            );
            if ($scope.selectedVisualizations.length == 0) {
              $scope.type = null;
              resetOrderBy();
            }
            updateAvailableVisualizations();
          };

          $scope.removeAllVisualizations = function() {
            $scope.selectedVisualizations = [];
            $scope.type = null;
            resetOrderBy();
            updateAvailableVisualizations();
          };
        }
      };
    }
  ]);