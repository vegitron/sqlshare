from django.db import models

# Create your models here.

class UserFile(models.Model):
    user_file = models.FileField(upload_to="user_files/%Y/%m/%d")

