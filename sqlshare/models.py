from django.db import models
from sqlshare.utils import _send_request
from django.utils import simplejson as json
from django.contrib.auth.models import User
import urllib

# Create your models here.

class UserFile(models.Model):
    user_file = models.FileField(upload_to="user_files/%Y/%m/%d")

class Dataset(models.Model):
    schema = models.CharField(max_length = 100)
    name = models.CharField(max_length = 140)

    def get_all_access(self):
        server_data = self._get_server_data()


        data = {
            'is_shared': server_data['is_shared'],
            'is_public': server_data['is_public'],
            'emails': [],
            'accounts': [],
        }

        stored_dataset_query = Dataset.objects.filter(schema = self.schema, name = self.name)

        if len(stored_dataset_query):
            stored_dataset = stored_dataset_query[0]
            local_data = DatasetEmailAccess.objects.filter(dataset = stored_dataset, is_active = True)

            for entry in local_data:
                data['emails'].append(entry.email)


        for username in server_data["authorized_viewers"]:
            person = User.objects.get_or_create(username = username)[0]

            data['accounts'].append({
                'login': username,
                'name': person.first_name,
                'surname': person.last_name,
                'origin_email': person.email,
            })


        return data

    def set_access(self, accounts, emails):
        data = {
            'is_shared': False,
            'is_public': False,
            'authorized_viewers': accounts,
        }

        if len(accounts) or len(emails):
            data['is_shared'] = True

        schema = self.schema
        name = self.name

        url = '/REST.svc/v2/db/dataset/%s/%s/permissions' % (urllib.quote(schema), urllib.quote(name))

        _send_request('PUT', url, {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
        }, body=json.dumps(data), user=schema)

        stored_dataset, was_created = Dataset.objects.get_or_create(schema = self.schema, name = self.name)

        DatasetEmailAccess.objects.filter(dataset=stored_dataset, is_active=False, email__in=emails).update(is_active = True)

        DatasetEmailAccess.objects.filter(dataset=stored_dataset, is_active=True).exclude(email__in=emails).update(is_active = False)

        for email in emails:
            res, created = DatasetEmailAccess.objects.get_or_create(dataset=stored_dataset, is_active=True, email=email)

    def _get_server_data(self):
        schema = self.schema
        name = self.name

        url = '/REST.svc/v2/db/dataset/%s/%s/permissions' % (urllib.quote(schema), urllib.quote(name))
        response = _send_request('GET', url, {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    }, user=schema)

        data = json.loads(response.read())

        return data

class DatasetEmailAccess(models.Model):
    dataset = models.ForeignKey(Dataset)
    email = models.CharField(max_length = 140)
    is_active = models.BooleanField()


