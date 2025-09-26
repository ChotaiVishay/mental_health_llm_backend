from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User


class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = organisation
        fields = ['organisation_key', 'organisation_name']
        read_only_fields = ['organisation_key']

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = service
        fields = ['service_key', 'organisation_key', 'service_name']
        read_only_fields = ['service_key']

class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = campus
        fields = ['campus_key', 'organisation_key', 'campus_name']
        read_only_fields = ['campus_key', 'organisation_key']

class ServiceCampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = service_campus
        fields = ['service_campus_key', 'service_key', 'campus_key', 'email', 'phone', 'website', 'notes', 'expectesd_wait_time', 'op_hours_24_7', 'op_hours_standard', 'op_hours_extended', 'op_hours_extended_details', 'address', 'suburb', 'state', 'postcode', 'eligibility_and_discription']        
        read_only_fields = ['service_campus_key', 'service_key', 'campus_key']

class serviceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = service_type
        fields = ['service_type_key', 'service_campus_key', 'service_type']
        read_only_fields = ['service_type_key', 'service_campus_key']

class costSerializer(serializers.ModelSerializer):
    class Meta:
        model = cost
        fields = ['cost_key', 'service_campus_key', 'cost_type']
        read_only_fields = ['cost_key', 'service_campus_key']

class referralSerializer(serializers.ModelSerializer):
    class Meta:
        model = referral_pathway
        fields = ['referral_key', 'service_campus_key', 'referral_pathway']
        read_only_fields = ['referral_key', 'service_campus_key']

class workforceSerializer(serializers.ModelSerializer):
    class Meta:
        model = workforce_type
        fields = ['workforce_key', 'service_campus_key', 'workforce_type']
        read_only_fields = ['workforce_key', 'service_campus_key']

class deliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = delivery_method
        fields = ['deliver_method_key', 'service_campus_key', 'delivery_method']
        read_only_fields = ['deliver_method_key', 'service_campus_key']

class regionSerializer(serializers.ModelSerializer):
    class Meta:
        model = region
        fields = ['region_key', 'region_name']
        read_only_fields = ['region_key']

class psostcodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = postcode
        fields = ['postcode_key', 'region_key', 'postcode']
        read_only_fields = ['postcode_key', 'region_key']

class target_populationSerializer(serializers.ModelSerializer):
    class Meta:
        model = target_population
        fields = ['target_population_key', 'service_campus_key', 'target_population']
        read_only_fields = ['target_population_key', 'service_campus_key']