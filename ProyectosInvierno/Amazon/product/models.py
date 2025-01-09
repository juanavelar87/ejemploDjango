from django.db import models

# Create your models here.
class Product(models.Model):
    name = models.CharField("Nombre", max_length=255)
    description = models.TextField("Descripción")
    price = models.DecimalField("Precio", max_digits=10, decimal_places=2)
    stock = models.IntegerField("Stock")
    image = models.ImageField("Imagen", upload_to="products")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name