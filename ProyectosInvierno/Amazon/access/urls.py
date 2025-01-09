from django.urls import path
from . import views

urlpatterns = [
    path('', views.homeView, name='home'),
    path('login', views.loginView, name='login'),
    path('logout', views.logoutView, name='logout'),
    path("register", views.registerView, name="register"),
]