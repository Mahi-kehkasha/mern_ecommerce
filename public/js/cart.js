function updateCartItemCount() {
  $.ajax({
    url: "/get-cart-count", // Replace this with the actual URL to fetch cart data from your server
    type: "GET",
    dataType: "json",
    success: function (response) {
      // Assuming your server response contains a property "itemCount" with the total number of items in the cart
      const cartItemCount = response.itemCount;
      const cartItemCountElement = document.getElementById("cartItemCount");
      cartItemCountElement.textContent = cartItemCount;
    },
    error: function (error) {
      console.log("Failed to fetch cart data: ", error);
    },
  });
}

// Call the function to update cart item count on page load
updateCartItemCount();
