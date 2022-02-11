/*
 * An object type representing an implicit sphere.
 *
 * @param center A Vector3 object representing the position of the center of the sphere
 * @param radius A Number representing the radius of the sphere.
 * 
 * Example usage:
 * var mySphere = new Sphere(new Vector3(1, 2, 3), 4.23);
 * var myRay = new Ray(new Vector3(0, 1, -10), new Vector3(0, 1, 0));
 * var result = mySphere.raycast(myRay);
 * 
 * if (result.hit) {
 *   console.log("Got a valid intersection!");
 * }
 */

/*
Name - Xinyuan Zhang
Partner - Miguel Tayag
submission is not the same 
*/

var Sphere = function (center, radius) {
  // Sanity checks (your modification should be below this where indicated)
  if (!(this instanceof Sphere)) {
    console.error("Sphere constructor must be called with the new operator");
  }

  this.center = center;
  this.radius = radius;

  // todo - make sure this.center and this.radius are replaced with default values if and only if they
  // are invalid or undefined (i.e. center should be of type Vector3 & radius should be a Number)
  // - the default center should be the zero vector
  // - the default radius should be 1
  // YOUR CODE HERE
  if (this.center === undefined || this.center == null) {
    this.center = new Vector3(0, 0, 0);
  }

  if (this.radius == null || this.radius === undefined) {
    this.radius = 1;
  }

  // Sanity checks (your modification should be above this)
  if (!(this.center instanceof Vector3)) {
    console.error("The sphere center must be a Vector3");
  }

  if ((typeof (this.radius) != 'number')) {
    console.error("The radius must be a Number");
  }
};

Sphere.prototype = {
  //----------------------------------------------------------------------------- 
  raycast: function (r1) {
    // todo - determine whether the ray intersects has a VALID intersection with this
    //        sphere and if so, where. A valid intersection is on the is in front of
    //        the ray and whose origin is NOT inside the sphere

    // Recommended steps
    // ------------------
    // 0. (optional) watch the video showing the complete implementation of plane.js
    //    You may find it useful to see a different piece of geometry coded.

    // 1. review slides/book math

    // 2. identity the vectors needed to solve for the coefficients in the quadratic equation

    // 3. calculate the discriminant

    // 4. use the discriminant to determine if further computation is necessary 
    //    if (discriminant...) { ... } else { ... }



    //what we know here
    //this.radius
    //this.center is vector, and the center of sphere 
    //r1 is ray (origin, direction) with 2 vector
    //1. origin + x * direction - (center)^2 = 0
    //x is what we are looking for

    //a = direction · direction
    //b = 2(origin - center) · direction
    //c = (origin - center) · (origin - center) - radius ^ 2

    //x = {-b +- root(b^2 - 4ac)} / 2a

    ///is r1.origin.clone
    var origin = r1.origin.clone();
    ///r1.direction.clone
    var direction = r1.direction.clone();

    var center = this.center.clone();

    var radius = this.radius;

    //dot here will not change this
    var a = direction.dot(direction);

    //because subtract is changing this
    origin.subtract(center);

    //dot here will not change this
    var b = 2 * origin.dot(direction);
    var c = origin.dot(origin) - Math.pow(radius, 2);

    var x_one = (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
    var x_two = (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);

    //console.log(x_one + " " + x_two);

    if (Math.pow(b, 2) - 4 * a * c < 0 || (x_one < 0 || x_two < 0)) {
      var result = { hit: false, point: null }
      return result;
    }

    //console.log(x_one + " " + x_two)
    //get the cloest point
    var small_x = x_one;
    if (x_one > x_two) {
      small_x = x_two;
    }

    var myOrigin = r1.origin.clone();
    var myDirection = r1.direction.clone();

    myDirection.multiplyScalar(small_x);

    //origin + alpha * direction, intersection point
    var myPoint = myOrigin.add(myDirection);

    var myLength = myDirection.length();

    var myNormal = (myPoint.clone().subtract(center)).normalize();

    console.log(myNormal)

    var result = {
      hit: true,
      point: myPoint,
      normal: myNormal,
      distance: myLength,
    };

    return result;



    // 5. return the following object literal "result" based on whether the intersection
    //    is valid (i.e. the intersection is in front of the ray AND the ray is not inside
    //    the sphere)
    //    case 1: no VALID intersections
    //      var result = { hit: false, point: null }
    //    case 2: 1 or more intersections
    //      var result = {
    //        hit: true,
    //        point: 'a Vector3 containing the CLOSEST VALID intersection',
    //        normal: 'a vector3 containing a unit length normal at the intersection point',
    //        distance: 'a scalar containing the intersection distance from the ray origin'
    //      }

    // An object created from a literal that we will return as our result
    // Replace the null values in the properties below with the right values

    var result = {
      hit: null,      // should be of type Boolean
      point: null,    // should be of type Vector3
      normal: null,   // should be of type Vector3
      distance: null, // should be of type Number (scalar)
    };

    return result;
  }
}

// EOF 00100001-10