from django.http import HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from .models import Product  # Adjust the import based on your actual models

def home(request):
    products=Product.objects.all()
    return render(request, 'product/home.html',{
        "products":products
    })

def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    return render(request, 'product/product_detail.html', {'product': product})

def cart(request):
    return render(request, 'cart.html')

def checkout(request):
    return render(request, 'checkout.html')

def create_product(request):
    if request.method=="GET":
        return render(request, "product/create_product.html")
    if request.method == "POST":
        name = request.POST.get('name')
        description = request.POST.get('description')
        price = request.POST.get('price')
        stock = request.POST.get('stock')
        image = request.FILES.get('image')
        
        if not all([name, description, price, stock, image]):
            return render(request, "product/create_product.html", {
                "message": "All fields are required."
            })
        
        try:
            price = float(price)
            stock = int(stock)
        except ValueError:
            return render(request, "product/create_product.html", {
                "message": "Invalid price or stock value."
            })
        
        product = Product.objects.create(
            name=name,
            description=description,
            price=price,
            stock=stock,
            image=image
        )
        product.save()
        return HttpResponseRedirect(reverse("product:home"))