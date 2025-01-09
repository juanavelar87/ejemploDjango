from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth import logout
from access.models import Usuario

def loginView(request):
    if request.method=="POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        # Check if authentication successful
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next', '')
            if next_url:
                return HttpResponseRedirect(next_url)
            else:
                return HttpResponseRedirect(reverse("product:home"))
        else:
            return render(request, "access/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        #Si ya esta autenticado
        if request.user.is_authenticated:
            return HttpResponseRedirect(reverse("product:home"))
        else:
            return render(request, "access/login.html")
    
def logoutView(request):
    logout(request)
    return HttpResponseRedirect(reverse("product:home"))

def registerView(request):
    if request.method=="GET":
        return render(request, "access/register.html")
    if request.method=="POST":
        email = request.POST["email"]
        age = request.POST["age"]
        username= request.POST["username"]
        password = request.POST["password"]
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]
        password_confirmation = request.POST["password_confirmation"]
        if password != password_confirmation:
            return render(request, "access/register.html", {
                "message": "Passwords must match."
            })
        user = Usuario(email=email, age=age, username=username, first_name=first_name, last_name=last_name)
        user.set_password(password)
        user.save()
        login(request, user)
        return HttpResponseRedirect(reverse("product:home"))

def homeView(request):
    return render(request, 'access/home.html')